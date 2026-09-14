import {
  checkPlaceholders,
  messageIgnoreTag,
} from '#packages/eslint-plugin-formatjs/placeholder-checks.js'
import {rule as placeholderRule} from '#packages/eslint-plugin-formatjs/rules/enforce-placeholders.js'
import {parse} from '@formatjs/icu-messageformat-parser'
import type {Rule} from 'eslint'
import type {
  CallExpression,
  NewExpression,
  Node,
  ObjectExpression,
} from 'estree-jsx'
import {
  extractMessages,
  isIntlFormatMessageCall,
  getSettings,
} from '#packages/eslint-plugin-formatjs/util.js'
import {messageTypes} from '#packages/eslint-plugin-formatjs/message-types.js'

export const name = 'enforce-message-types'
const modules = new Set([
  '@formatjs/intl',
  'react-intl',
  'react-intl/server',
  'intl-messageformat',
])

function staticObject(node: Node | undefined): node is ObjectExpression {
  return (
    node?.type === 'ObjectExpression' &&
    node.properties.every(
      property =>
        property.type === 'Property' &&
        !property.computed &&
        property.kind === 'init' &&
        !property.method
    )
  )
}

function staticMessage(node: Node | undefined): boolean {
  if (!node) return false
  if (node.type === 'Literal') return typeof node.value === 'string'
  if (node.type === 'TemplateLiteral') return node.expressions.length === 0
  if (node.type === 'BinaryExpression')
    return (
      node.operator === '+' &&
      staticMessage(node.left) &&
      staticMessage(node.right)
    )
  const wrapper = node as unknown as {type: string; expression?: Node}
  if (
    [
      'TSAsExpression',
      'TSSatisfiesExpression',
      'TSNonNullExpression',
      'TSTypeAssertion',
    ].includes(wrapper.type)
  )
    return staticMessage(wrapper.expression)
  return false
}

function importedHelper(
  context: Rule.RuleContext,
  node: CallExpression | NewExpression
) {
  const callee = node.callee
  const identifier =
    callee.type === 'Identifier'
      ? callee
      : callee.type === 'MemberExpression' &&
          !callee.computed &&
          callee.object.type === 'Identifier'
        ? callee.object
        : undefined
  if (!identifier) return
  let scope: ReturnType<typeof context.sourceCode.getScope> | null =
    context.sourceCode.getScope(node)
  while (scope) {
    const variable = scope.set.get(identifier.name)
    if (variable) {
      const definition = variable.defs[0]
      if (definition?.type !== 'ImportBinding') return
      const module = definition.parent.source.value
      if (typeof module !== 'string' || !modules.has(module)) return
      const specifier = definition.node
      let helper: string | undefined
      if (
        callee.type === 'Identifier' &&
        specifier.type === 'ImportSpecifier'
      ) {
        helper =
          specifier.imported.type === 'Identifier'
            ? specifier.imported.name
            : String(specifier.imported.value)
      } else if (
        callee.type === 'MemberExpression' &&
        callee.property.type === 'Identifier' &&
        specifier.type === 'ImportNamespaceSpecifier'
      ) {
        helper = callee.property.name
      }
      if (node.type === 'NewExpression' && module === 'intl-messageformat') {
        if (
          (callee.type === 'Identifier' &&
            specifier.type === 'ImportDefaultSpecifier') ||
          helper === 'IntlMessageFormat' ||
          helper === 'default'
        )
          return {module, helper: 'IntlMessageFormat'}
        return
      }
      if (module === 'intl-messageformat') return
      if (helper === 'defineMessage' || helper === 'defineMessages')
        return {module, helper}
      return
    }
    scope = scope.upper
  }
}

function staticString(node: Node | undefined): string | undefined {
  if (!node) return
  if (node.type === 'Literal')
    return typeof node.value === 'string' ? node.value : undefined
  if (node.type === 'TemplateLiteral' && node.expressions.length === 0)
    return node.quasis[0].value.cooked ?? undefined
  if (node.type === 'BinaryExpression' && node.operator === '+') {
    const left = staticString(node.left)
    const right = staticString(node.right)
    if (left !== undefined && right !== undefined) return left + right
  }
  const wrapper = node as unknown as {type: string; expression?: Node}
  if (
    [
      'TSAsExpression',
      'TSSatisfiesExpression',
      'TSNonNullExpression',
      'TSTypeAssertion',
    ].includes(wrapper.type)
  )
    return staticString(wrapper.expression)
}

interface TypeNode {
  type: string
  params?: TypeNode[]
  typeArguments?: TypeNode
  typeParameters?: TypeNode
  members?: TypeNode[]
  types?: TypeNode[]
  key?: {type: string; name?: string; value?: unknown}
  typeAnnotation?: {typeAnnotation: TypeNode}
  typeName?: {type: string; name?: string}
  source?: {value?: unknown}
  argument?: TypeNode
  literal?: {value?: unknown}
  value?: unknown
  qualifier?: {type: string; name?: string}
  optional?: boolean
  readonly?: boolean
  computed?: boolean
}

// Render generated type syntax for stable comparisons before applying autofix.
function renderType(node: TypeNode | undefined): string | undefined {
  if (!node) return
  const keywords: Record<string, string> = {
    TSNumberKeyword: 'number',
    TSBigIntKeyword: 'bigint',
    TSStringKeyword: 'string',
  }
  if (keywords[node.type]) return keywords[node.type]
  if (node.type === 'TSTypeReference' && node.typeName?.type === 'Identifier') {
    const parameters = (node.typeArguments ?? node.typeParameters)?.params
    if (!parameters) return node.typeName.name
    const types = parameters.map(renderType)
    if (types.every(type => type !== undefined))
      return node.typeName.name + '<' + types.join(', ') + '>'
    return
  }
  if (node.type === 'TSUnionType') {
    const types = node.types?.map(renderType)
    if (types?.every(type => type !== undefined)) return types.join(' | ')
  }
  if (node.type === 'TSImportType' && node.qualifier?.type === 'Identifier') {
    const module =
      node.source?.value ??
      node.argument?.literal?.value ??
      node.argument?.value
    if (typeof module === 'string')
      return `import(${JSON.stringify(module)}).${node.qualifier.name}`
  }
  if (node.type === 'TSTypeLiteral' && node.members) {
    const fields: string[] = []
    for (const member of node.members) {
      if (member.type !== 'TSPropertySignature' || member.computed) return
      const key =
        member.key?.type === 'Identifier' ? member.key.name : member.key?.value
      const type = renderType(member.typeAnnotation?.typeAnnotation)
      if (key === undefined || type === undefined) return
      fields.push(
        `${member.readonly ? 'readonly ' : ''}${JSON.stringify(String(key))}${member.optional ? '?' : ''}: ${type}`
      )
    }
    return fields.length ? `{ ${fields.join('; ')} }` : '{}'
  }
}

function hoistTypes(context: Rule.RuleContext, node: Node, contract: string) {
  const source = context.sourceCode
  const imports = new Map<string, string[]>()
  const occupied = new Set(
    source.scopeManager?.scopes.flatMap(scope =>
      scope.variables.map(variable => variable.name)
    )
  )
  const resolved = new Map<string, string>()
  const text = contract.replace(
    /import\(("(?:[^"\\]|\\.)*")\)\.(MessageTag|MessageValue|TypedMessageDescriptor)/g,
    (reference, quotedModule: string, imported: string) => {
      if (resolved.has(reference)) return resolved.get(reference)!
      const module = JSON.parse(quotedModule) as string
      for (const declaration of source.ast.body) {
        if (
          declaration.type !== 'ImportDeclaration' ||
          declaration.source.value !== module
        )
          continue
        for (const specifier of declaration.specifiers) {
          if (specifier.type !== 'ImportSpecifier') continue
          const name =
            specifier.imported.type === 'Identifier'
              ? specifier.imported.name
              : specifier.imported.value
          if (name !== imported) continue
          let scope: ReturnType<typeof source.getScope> | null =
            source.getScope(node)
          while (scope && !scope.set.has(specifier.local.name))
            scope = scope.upper
          if (
            scope?.set
              .get(specifier.local.name)
              ?.defs.some(def => def.node === specifier)
          ) {
            resolved.set(reference, specifier.local.name)
            return specifier.local.name
          }
        }
      }
      let local = imported
      for (let suffix = 1; occupied.has(local); suffix++)
        local = imported + suffix
      occupied.add(local)
      const specifiers = imports.get(quotedModule) ?? []
      specifiers.push(imported + (local === imported ? '' : ' as ' + local))
      imports.set(quotedModule, specifiers)
      resolved.set(reference, local)
      return local
    }
  )
  return {
    text,
    fix(fixer: Rule.RuleFixer): Rule.Fix[] {
      if (!imports.size) return []
      const declarations = source.ast.body.filter(
        statement => statement.type === 'ImportDeclaration'
      )
      let anchor: Node | undefined = declarations.at(-1)
      if (!anchor) {
        for (const statement of source.ast.body) {
          if (
            statement.type !== 'ExpressionStatement' ||
            statement.expression.type !== 'Literal' ||
            typeof statement.expression.value !== 'string'
          )
            break
          anchor = statement
        }
      }
      const block = [...imports]
        .map(
          ([module, specifiers]) =>
            'import type {' + specifiers.join(', ') + '} from ' + module + ';'
        )
        .join('\n')
      return anchor
        ? [fixer.insertTextAfter(anchor, '\n' + block)]
        : [fixer.insertTextBefore(source.ast.body[0], block + '\n')]
    },
  }
}

// Replace broad catalog annotations with explicit per-message contracts.
function catalogAnnotation(context: Rule.RuleContext, node: CallExpression) {
  const parent = (node as Node & {parent?: Node}).parent
  if (parent?.type !== 'VariableDeclarator' || parent.init !== node) return
  const annotation = (
    parent.id as unknown as {
      typeAnnotation?: {typeAnnotation: TypeNode}
    }
  ).typeAnnotation?.typeAnnotation
  if (!annotation) return

  function imported(type: TypeNode, name: string): boolean {
    if (type.type !== 'TSTypeReference' || type.typeName?.type !== 'Identifier')
      return false
    let scope: ReturnType<typeof context.sourceCode.getScope> | null =
      context.sourceCode.getScope(node)
    while (scope) {
      const binding = scope.set.get(type.typeName.name!)
      if (binding) {
        const definition = binding.defs[0]
        return (
          definition?.type === 'ImportBinding' &&
          descriptorModules.has(String(definition.parent.source.value)) &&
          definition.node.type === 'ImportSpecifier' &&
          (definition.node.imported.type === 'Identifier'
            ? definition.node.imported.name
            : definition.node.imported.value) === name
        )
      }
      scope = scope.upper
    }
    return false
  }

  function broad(type: TypeNode): boolean {
    if (type.type === 'TSTypeLiteral')
      return !!type.members?.every(
        member =>
          member.type === 'TSPropertySignature' &&
          !!member.typeAnnotation &&
          imported(member.typeAnnotation.typeAnnotation, 'MessageDescriptor')
      )
    let scope: ReturnType<typeof context.sourceCode.getScope> | null =
      context.sourceCode.getScope(node)
    while (scope) {
      if (scope.set.get(type.typeName?.name ?? '')?.defs.length) return false
      scope = scope.upper
    }
    const parameters = (type.typeArguments ?? type.typeParameters)?.params
    if (type.typeName?.name === 'Readonly' && parameters?.length === 1)
      return broad(parameters[0])
    return (
      type.typeName?.name === 'Record' &&
      parameters?.length === 2 &&
      imported(parameters[1], 'MessageDescriptor')
    )
  }

  function typedMap(type: TypeNode): boolean {
    return (
      type.type === 'TSTypeLiteral' &&
      !!type.members?.every(
        member =>
          member.type === 'TSPropertySignature' &&
          !member.computed &&
          !!member.typeAnnotation &&
          imported(
            member.typeAnnotation.typeAnnotation,
            'TypedMessageDescriptor'
          )
      )
    )
  }

  let base = annotation
  let generated: TypeNode | undefined = typedMap(annotation)
    ? annotation
    : undefined
  if (
    annotation.type === 'TSIntersectionType' &&
    annotation.types?.length === 2
  ) {
    const [left, right] = annotation.types
    if (
      right.type === 'TSTypeLiteral' &&
      right.members?.every(
        member =>
          member.type === 'TSPropertySignature' &&
          !!member.typeAnnotation &&
          imported(
            member.typeAnnotation.typeAnnotation,
            'TypedMessageDescriptor'
          )
      )
    ) {
      base = left
      generated = right
    }
  }
  return {annotation, base, generated, supported: broad(base) || typedMap(base)}
}

const descriptorModules = new Set([
  '@formatjs/intl',
  'react-intl',
  'react-intl/server',
])

function checkInlineMessage(context: Rule.RuleContext, node: CallExpression) {
  if (node.type !== 'CallExpression') return
  const settings = getSettings(context)
  if (node.callee.type === 'MemberExpression' && node.callee.computed) return
  if (
    !isIntlFormatMessageCall(
      {...node, arguments: [{type: 'ObjectExpression', properties: []}]},
      settings.additionalFunctionNames
    )
  )
    return
  const source = context.sourceCode
  const call = node as CallExpression & {
    typeArguments?: Node
    typeParameters?: Node
  }
  const generic = call.typeArguments ?? call.typeParameters
  if (!generic && !context.options[0]?.generateTypes) return
  const generated =
    !!generic &&
    /^<\s*\/\* @formatjs-generated \*\//.test(source.getText(generic))
  const descriptor = node.arguments[0]
  if (!staticObject(descriptor)) {
    if (generic) context.report({node, messageId: 'dynamic'})
    return
  }
  const existingModule = source.ast.body.find(
    statement =>
      statement.type === 'ImportDeclaration' &&
      typeof statement.source.value === 'string' &&
      descriptorModules.has(statement.source.value)
  )
  const module =
    context.options[0]?.moduleSource ??
    (existingModule?.type === 'ImportDeclaration'
      ? String(existingModule.source.value)
      : '@formatjs/intl')
  const ignoreTag = messageIgnoreTag(context, node)
  if (ignoreTag === undefined) {
    if (generic) context.report({node, messageId: 'dynamic'})
    return !!generic
  }
  const messages = extractMessages(node, settings)
  const message = messages[0]?.[0]
  if (
    messages.length !== 1 ||
    !message ||
    typeof message.message.defaultMessage !== 'string' ||
    !staticMessage(message.messageNode ?? undefined)
  ) {
    if (generic) context.report({node, messageId: 'dynamic'})
    return
  }
  let contract: string
  try {
    contract = messageTypes(
      parse(message.message.defaultMessage, {ignoreTag}),
      module,
      context.options[0]?.ignoreList
    )
  } catch (error) {
    context.report({
      node,
      messageId: 'invalid',
      data: {error: error instanceof Error ? error.message : String(error)},
    })
    return true
  }
  const imports = hoistTypes(context, node, contract)
  contract = imports.text
  const parameters = (generic as unknown as TypeNode | undefined)?.params
  if (
    parameters &&
    parameters.length >= 1 &&
    parameters.length <= 2 &&
    renderType(parameters[0]) === contract &&
    !generated
  )
    return true
  if (generic && (!parameters || parameters.length > 2)) {
    context.report({node: generic, messageId: 'manual'})
    return true
  }
  context.report({
    node,
    messageId: 'contract',
    fix(fixer) {
      return [
        ...imports.fix(fixer),
        generic && parameters?.[0]
          ? fixer.replaceTextRange(
              [
                generic.range![0] + 1,
                (parameters[0] as unknown as Node).range![1],
              ],
              contract
            )
          : fixer.insertTextAfter(
              node.optional ? source.getTokenAfter(node.callee)! : node.callee,
              '<' + contract + '>'
            ),
      ]
    },
  })
  return true
}

export const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Check ICU placeholders and optionally generate TypeScript argument contracts',
    },
    fixable: 'code',
    schema: [
      {
        type: 'object',
        properties: {
          generateTypes: {type: 'boolean'},
          ignoreList: {type: 'array', items: {type: 'string'}},
          moduleSource: {type: 'string', enum: [...descriptorModules]},
        },
        additionalProperties: false,
      },
    ],
    messages: {
      ...placeholderRule.meta!.messages,
      contract: 'Generate or refresh the ICU argument contract.',
      invalid: 'Cannot generate message types: {{error}}.',
      manual:
        'Unsupported number of generic arguments; update the call manually.',
      annotation:
        'Catalog annotation may erase ICU contracts; use per-message TypedMessageDescriptor types.',
      dynamic:
        'Typed messages require static message strings and parser options for contract verification.',
    },
  },
  create(context) {
    const listeners: Rule.RuleListener = {
      JSXOpeningElement(node: Node) {
        checkPlaceholders(context, node)
      },
      NewExpression(node: Node) {
        if (
          node.type !== 'NewExpression' ||
          !/\.[cm]?tsx?$/.test(context.filename)
        )
          return
        const imported = importedHelper(context, node)
        if (imported?.helper !== 'IntlMessageFormat') return
        const source = context.sourceCode
        const call = node as NewExpression & {
          typeArguments?: Node
          typeParameters?: Node
        }
        const generic = call.typeArguments ?? call.typeParameters
        if (!generic && !context.options[0]?.generateTypes) return
        const generated =
          !!generic &&
          /^<\s*\/\* @formatjs-generated \*\//.test(source.getText(generic))
        const message = staticString(node.arguments[0])
        const options = node.arguments[3]
        let ignoreTag = false
        if (
          message === undefined ||
          node.arguments.some(argument => argument.type === 'SpreadElement') ||
          (options && !staticObject(options))
        ) {
          if (generic) context.report({node, messageId: 'dynamic'})
          return
        }
        if (staticObject(options)) {
          for (const property of options.properties) {
            if (property.type !== 'Property') continue
            const key =
              property.key.type === 'Identifier'
                ? property.key.name
                : property.key.type === 'Literal'
                  ? property.key.value
                  : undefined
            if (key !== 'ignoreTag') continue
            if (
              property.value.type !== 'Literal' ||
              typeof property.value.value !== 'boolean'
            ) {
              if (generic) context.report({node, messageId: 'dynamic'})
              return
            }
            ignoreTag = property.value.value
          }
        }
        let contract: string
        try {
          contract = messageTypes(
            parse(message, {ignoreTag}),
            imported.module,
            context.options[0]?.ignoreList
          )
        } catch (error) {
          context.report({
            node,
            messageId: 'invalid',
            data: {
              error: error instanceof Error ? error.message : String(error),
            },
          })
          return
        }
        const imports = hoistTypes(context, node, contract)
        contract = imports.text
        const parameters = (generic as unknown as TypeNode | undefined)?.params
        if (
          parameters?.length === 1 &&
          renderType(parameters[0]) === contract &&
          !generated
        )
          return
        if (generic && parameters?.length !== 1) {
          context.report({node: generic, messageId: 'manual'})
          return
        }
        context.report({
          node,
          messageId: 'contract',
          fix(fixer) {
            const expected = `<${contract}>`
            return [
              ...imports.fix(fixer),
              generic
                ? fixer.replaceText(generic, expected)
                : fixer.insertTextAfter(node.callee, expected),
            ]
          },
        })
      },
      CallExpression(node: Node) {
        if (node.type !== 'CallExpression') return
        if (!/\.[cm]?tsx?$/.test(context.filename)) {
          checkPlaceholders(context, node)
          return
        }
        const imported = importedHelper(context, node)
        if (!imported) {
          if (!checkInlineMessage(context, node))
            checkPlaceholders(context, node)
          return
        }
        const source = context.sourceCode
        const call = node as CallExpression & {
          typeArguments?: Node
          typeParameters?: Node
        }
        const generic = call.typeArguments ?? call.typeParameters
        const generated =
          !!generic &&
          /^<\s*\/\* @formatjs-generated \*\//.test(source.getText(generic))
        const options = node.arguments[1]
        const typed =
          staticObject(options) &&
          options.properties.length === 1 &&
          options.properties.some(
            p =>
              p.type === 'Property' &&
              (p.key.type === 'Identifier'
                ? p.key.name
                : p.key.type === 'Literal'
                  ? p.key.value
                  : undefined) === 'typed' &&
              p.value.type === 'Literal' &&
              p.value.value === true
          )
        if (!typed && !generated && !context.options[0]?.generateTypes) return
        // Existing annotations and unrelated second arguments belong to the caller.
        if (
          !typed &&
          generic &&
          !generated &&
          !context.options[0]?.generateTypes
        )
          return
        if (node.arguments.length > 2 || (options && !typed)) return
        const descriptor = node.arguments[0]
        if (!staticObject(descriptor)) {
          if (typed || generated) context.report({node, messageId: 'dynamic'})
          return
        }
        if (
          imported.helper === 'defineMessages' &&
          !descriptor.properties.every(
            p => p.type === 'Property' && staticObject(p.value)
          )
        ) {
          if (typed || generated) context.report({node, messageId: 'dynamic'})
          return
        }
        const messages = extractMessages(
          {...node, callee: {type: 'Identifier', name: imported.helper}},
          getSettings(context)
        )
        if (
          messages.some(
            ([message]) =>
              typeof message.message.defaultMessage !== 'string' ||
              !staticMessage(message.messageNode ?? undefined)
          ) ||
          messages.length !==
            (imported.helper === 'defineMessage'
              ? 1
              : descriptor.properties.length)
        ) {
          if (typed || generated) context.report({node, messageId: 'dynamic'})
          return
        }
        const annotation =
          imported.helper === 'defineMessages'
            ? catalogAnnotation(context, node)
            : undefined
        if (annotation && !annotation.supported) {
          context.report({
            node: annotation.annotation as unknown as Node,
            messageId: 'annotation',
          })
          return
        }
        let contract: string
        let catalogType: string | undefined
        try {
          const types = messages.map(([message]) =>
            messageTypes(
              parse(message.message.defaultMessage!, {
                ignoreTag: getSettings(context).ignoreTag,
              }),
              imported.module,
              context.options[0]?.ignoreList
            )
          )
          if (annotation) {
            catalogType =
              '{ ' +
              descriptor.properties
                .map((property, index) => {
                  if (property.type !== 'Property')
                    throw new Error('Unexpected spread')
                  const key =
                    property.key.type === 'Identifier'
                      ? property.key.name
                      : property.key.type === 'Literal'
                        ? String(property.key.value)
                        : undefined
                  if (key === undefined)
                    throw new Error('Unsupported catalog key')
                  return (
                    'readonly ' +
                    JSON.stringify(key) +
                    ': import(' +
                    JSON.stringify(imported.module) +
                    ').TypedMessageDescriptor<' +
                    types[index] +
                    '>'
                  )
                })
                .join('; ') +
              ' }'
            if (!descriptor.properties.length) catalogType = '{}'
          }
          contract =
            imported.helper === 'defineMessage'
              ? types[0]
              : descriptor.properties.length === 0
                ? '{}'
                : `{ ${descriptor.properties
                    .map((p, i) => {
                      if (p.type !== 'Property')
                        throw new Error('Unexpected spread')
                      const key =
                        p.key.type === 'Identifier'
                          ? p.key.name
                          : p.key.type === 'Literal'
                            ? String(p.key.value)
                            : undefined
                      if (key === undefined)
                        throw new Error('Unsupported catalog key')
                      return `readonly ${JSON.stringify(key)}: ${types[i]}`
                    })
                    .join('; ')} }`
        } catch (error) {
          context.report({
            node,
            messageId: 'invalid',
            data: {
              error: error instanceof Error ? error.message : String(error),
            },
          })
          return
        }
        const imports = hoistTypes(
          context,
          node,
          contract + (catalogType ? '\n' + catalogType : '')
        )
        ;[contract, catalogType] = imports.text.split('\n')
        const annotationMatches =
          !annotation ||
          (annotation.annotation === annotation.generated &&
            renderType(annotation.generated) === catalogType)
        const expected = `<${contract}>`
        const parameters = (generic as unknown as TypeNode | undefined)?.params
        if (
          parameters &&
          parameters.length >= 1 &&
          parameters.length <= 2 &&
          renderType(parameters[0]) === contract &&
          typed &&
          !generated &&
          annotationMatches
        )
          return
        if (
          generic &&
          (!parameters || parameters.length < 1 || parameters.length > 2)
        ) {
          context.report({node: generic, messageId: 'manual'})
          return
        }
        context.report({
          node,
          messageId: 'contract',
          fix(fixer) {
            const edits = [
              ...imports.fix(fixer),
              generic && parameters?.[0]
                ? fixer.replaceTextRange(
                    [
                      generic.range![0] + 1,
                      (parameters[0] as unknown as Node).range![1],
                    ],
                    contract
                  )
                : fixer.insertTextAfter(
                    node.optional
                      ? source.getTokenAfter(node.callee)!
                      : node.callee,
                    expected
                  ),
            ]
            if (annotation && !annotationMatches) {
              edits.push(
                fixer.replaceText(
                  annotation.annotation as unknown as Node,
                  catalogType!
                )
              )
            }
            if (!typed) {
              const close = source.getLastToken(node)!
              const previous = source.getTokenBefore(close)!
              edits.push(
                fixer.insertTextBefore(
                  close,
                  `${previous.value === ',' ? '' : ','} {typed: true}`
                )
              )
            }
            return edits
          },
        })
      },
    }
    const parserServices = context.sourceCode.parserServices
    if (parserServices?.defineTemplateBodyVisitor) {
      return parserServices.defineTemplateBodyVisitor(
        {CallExpression: listeners.CallExpression},
        {CallExpression: listeners.CallExpression}
      )
    }
    return listeners
  },
}
