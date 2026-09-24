import type {JSXElement, JSXFragment, Node, ImportSpecifier} from 'estree-jsx'
import type {Rule} from 'eslint'
import {
  getSettings,
  isIntlFormatMessageCall,
} from '#packages/eslint-plugin-formatjs/util.js'

export const name = 'prefer-formatted-message'

function binding(context: Rule.RuleContext, node: Node, name: string) {
  let scope: ReturnType<typeof context.sourceCode.getScope> | null =
    context.sourceCode.getScope(node)
  while (scope) {
    const variable = scope.set.get(name)
    if (variable) return variable
    scope = scope.upper
  }
}

function importedName(specifier: ImportSpecifier) {
  return specifier.imported.type === 'Identifier'
    ? specifier.imported.name
    : specifier.imported.value
}

function isHookFormatter(context: Rule.RuleContext, callee: Node): boolean {
  const identifier =
    callee.type === 'Identifier'
      ? callee
      : callee.type === 'MemberExpression' &&
          !callee.computed &&
          !callee.optional &&
          callee.property.type === 'Identifier' &&
          ['formatMessage', '$formatMessage', '$t'].includes(
            callee.property.name
          ) &&
          callee.object.type === 'Identifier'
        ? callee.object
        : undefined
  if (!identifier) return false
  const variable = binding(context, callee, identifier.name)
  const definition = variable?.defs[0]
  if (
    definition?.type !== 'Variable' ||
    definition.parent?.kind !== 'const' ||
    variable?.references.some(
      reference => reference.isWrite() && !reference.init
    )
  )
    return false
  const {id, init} = definition.node
  if (
    init?.type !== 'CallExpression' ||
    init.optional ||
    init.arguments.length ||
    init.callee.type !== 'Identifier'
  )
    return false
  const hook = binding(context, init, init.callee.name)?.defs[0]
  if (
    hook?.type !== 'ImportBinding' ||
    hook.node.type !== 'ImportSpecifier' ||
    importedName(hook.node) !== 'useIntl' ||
    (hook.node as Node & {importKind?: string}).importKind === 'type' ||
    (hook.parent as Node & {importKind?: string}).importKind === 'type' ||
    hook.parent.source.value !== 'react-intl'
  )
    return false
  if (callee.type === 'MemberExpression') return id.type === 'Identifier'
  return (
    id.type === 'ObjectPattern' &&
    id.properties.some(
      property =>
        property.type === 'Property' &&
        !property.computed &&
        property.key.type === 'Identifier' &&
        ['formatMessage', '$formatMessage', '$t'].includes(property.key.name) &&
        property.value.type === 'Identifier' &&
        property.value.name === identifier.name
    )
  )
}

function component(context: Rule.RuleContext, node: Node) {
  const source = context.sourceCode
  for (const declaration of source.ast.body) {
    if (
      declaration.type !== 'ImportDeclaration' ||
      declaration.source.value !== 'react-intl' ||
      (declaration as Node & {importKind?: string}).importKind === 'type'
    )
      continue
    for (const specifier of declaration.specifiers) {
      if (
        specifier.type === 'ImportSpecifier' &&
        importedName(specifier) === 'FormattedMessage' &&
        /^[A-Z]/.test(specifier.local.name) &&
        (specifier as Node & {importKind?: string}).importKind !== 'type' &&
        binding(context, node, specifier.local.name)?.defs.some(
          definition => definition.node === specifier
        )
      )
        return {name: specifier.local.name}
    }
  }

  // Include unresolved references so a new import cannot capture an existing use.
  const occupied = new Set(
    source.scopeManager?.scopes.flatMap(scope => [
      ...scope.variables.map(variable => variable.name),
      ...scope.references.map(reference => reference.identifier.name),
    ])
  )
  let local = 'FormattedMessage'
  for (let suffix = 1; occupied.has(local); suffix++)
    local = 'FormattedMessage' + suffix
  const specifier =
    local === 'FormattedMessage' ? local : 'FormattedMessage as ' + local
  // The verified useIntl binding guarantees a runtime named import.
  const declaration = source.ast.body.find(
    statement =>
      statement.type === 'ImportDeclaration' &&
      statement.source.value === 'react-intl' &&
      (statement as Node & {importKind?: string}).importKind !== 'type' &&
      statement.specifiers.some(
        specifier => specifier.type === 'ImportSpecifier'
      )
  )
  if (declaration?.type !== 'ImportDeclaration') return
  const anchor = declaration.specifiers.find(
    specifier => specifier.type === 'ImportSpecifier'
  )!
  return {
    name: local,
    insert: (fixer: Rule.RuleFixer) =>
      fixer.insertTextBefore(anchor, specifier + ', '),
  }
}

export const rule: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    fixable: 'code',
    docs: {
      description:
        'Prefer `FormattedMessage` component over `intl.formatMessage` if applicable.',
      url: 'https://formatjs.github.io/docs/tooling/linter#prefer-formatted-message',
    },
    messages: {
      jsxChildren:
        'Prefer `FormattedMessage` over `intl.formatMessage` in the JSX children expression.',
    },
    schema: [],
  },
  // TODO: Vue support
  create(context) {
    const {additionalFunctionNames} = getSettings(context)
    const source = context.sourceCode
    function checkChildren(node: JSXElement | JSXFragment) {
      for (const child of node.children) {
        if (
          child.type !== 'JSXExpressionContainer' ||
          !isIntlFormatMessageCall(child.expression, additionalFunctionNames)
        )
          continue
        context.report({
          node: child,
          messageId: 'jsxChildren',
          fix(fixer) {
            const call = child.expression
            if (
              call.type !== 'CallExpression' ||
              call.optional ||
              call.arguments.length > 2 ||
              !isHookFormatter(context, call.callee) ||
              source.getCommentsInside(child).length ||
              (
                call as Node & {
                  typeArguments?: unknown
                  typeParameters?: unknown
                }
              ).typeArguments ||
              (call as Node & {typeParameters?: unknown}).typeParameters
            )
              return null
            const [descriptor, values] = call.arguments
            if (
              descriptor?.type !== 'ObjectExpression' ||
              values?.type === 'SpreadElement'
            )
              return null
            const attributes: string[] = []
            const keys = new Set<string>()
            for (const property of descriptor.properties) {
              if (
                property.type !== 'Property' ||
                property.computed ||
                property.method ||
                property.kind !== 'init'
              )
                return null
              const key =
                property.key.type === 'Identifier'
                  ? property.key.name
                  : property.key.type === 'Literal'
                    ? property.key.value
                    : undefined
              // Extra descriptor keys can become React props (key, ref, tagName, etc.).
              if (
                typeof key !== 'string' ||
                !['id', 'defaultMessage', 'description'].includes(key) ||
                keys.has(key)
              )
                return null
              keys.add(key)
              attributes.push(
                key + '={(' + source.getText(property.value) + ')}'
              )
            }
            if (values)
              attributes.push('values={(' + source.getText(values) + ')}')
            const target = component(context, child)
            if (!target) return null
            const replacement =
              '<' +
              target.name +
              (attributes.length ? ' ' + attributes.join(' ') : '') +
              ' />'
            return [
              ...(target.insert ? [target.insert(fixer)] : []),
              fixer.replaceText(child, replacement),
            ]
          },
        })
      }
    }
    return {
      JSXElement: checkChildren,
      JSXFragment: checkChildren,
    }
  },
}
