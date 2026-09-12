import {parse} from '@formatjs/icu-messageformat-parser'
import type {Rule} from 'eslint'
import type {CallExpression, Node, ObjectExpression} from 'estree-jsx'
import {
  extractMessages,
  getSettings,
} from '#packages/eslint-plugin-formatjs/util.js'
import {messageTypes} from '#packages/eslint-plugin-formatjs/message-types.js'

export const name = 'enforce-message-types'
const marker = '/* @formatjs-generated */'
const modules = new Set(['@formatjs/intl', 'react-intl', 'react-intl/server'])

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

function importedHelper(context: Rule.RuleContext, node: CallExpression) {
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
      if (helper === 'defineMessage' || helper === 'defineMessages')
        return {module, helper}
      return
    }
    scope = scope.upper
  }
}

interface TypeNode {
  type: string
  params?: TypeNode[]
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

// Render only the type syntax we generate. Unsupported handwritten types are
// reported without being rewritten; property names retain their exact values.
function renderType(node: TypeNode | undefined): string | undefined {
  if (!node) return
  const keywords: Record<string, string> = {
    TSNumberKeyword: 'number',
    TSBigIntKeyword: 'bigint',
    TSStringKeyword: 'string',
  }
  if (keywords[node.type]) return keywords[node.type]
  if (node.type === 'TSTypeReference' && node.typeName?.name === 'Date')
    return 'Date'
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
      if (
        member.type !== 'TSPropertySignature' ||
        member.optional ||
        member.readonly ||
        member.computed
      )
        return
      const key =
        member.key?.type === 'Identifier' ? member.key.name : member.key?.value
      const type = renderType(member.typeAnnotation?.typeAnnotation)
      if (key === undefined || type === undefined) return
      fields.push(`${JSON.stringify(String(key))}: ${type}`)
    }
    return fields.length ? `{ ${fields.join('; ')} }` : '{}'
  }
}

export const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Check and optionally generate ICU argument contracts for typed message declarations',
    },
    fixable: 'code',
    schema: [
      {
        type: 'object',
        properties: {generateTypes: {type: 'boolean'}},
        additionalProperties: false,
      },
    ],
    messages: {
      contract: 'Generate or refresh the ICU argument contract.',
      invalid: 'Cannot generate message types: {{error}}.',
      manual:
        'The handwritten contract differs from the parsed message; update it manually.',
      dynamic:
        'Typed messages require static descriptors and defaultMessage strings for contract verification.',
    },
  },
  create(context) {
    return {
      CallExpression(node: Node) {
        if (
          node.type !== 'CallExpression' ||
          !/\.[cm]?tsx?$/.test(context.filename)
        )
          return
        const imported = importedHelper(context, node)
        if (!imported) return
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
        if (!typed && generic && !generated) return
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
        let contract: string
        try {
          const types = messages.map(([message]) =>
            messageTypes(
              parse(message.message.defaultMessage!, {
                ignoreTag: getSettings(context).ignoreTag,
              }),
              imported.module
            )
          )
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
                      return `${JSON.stringify(key)}: ${types[i]}`
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
        const expected = `<${marker} ${contract}>`
        const parameters = (generic as unknown as TypeNode | undefined)?.params
        if (
          parameters?.length === 1 &&
          renderType(parameters[0]) === contract &&
          typed
        )
          return
        if (generic && !generated) {
          context.report({node: generic, messageId: 'manual'})
          return
        }
        context.report({
          node,
          messageId: 'contract',
          fix(fixer) {
            const edits = [
              generic
                ? fixer.replaceText(generic, expected)
                : fixer.insertTextAfter(
                    node.optional
                      ? source.getTokenAfter(node.callee)!
                      : node.callee,
                    expected
                  ),
            ]
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
  },
}
