import {TSESTree} from '@typescript-eslint/utils'
import {RuleContext, RuleModule} from '@typescript-eslint/utils/ts-eslint'
import {getParserServices} from '../context-compat'

type MessageIds = 'untranslatedProperty'
type PropertyConfig = {
  include: string[]
}
type Options = [PropertyConfig?]

export const name = 'no-literal-string-in-object'

export const rule: RuleModule<MessageIds, Options> = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce translation of specific object properties',
      url: 'https://formatjs.github.io/docs/tooling/linter#no-literal-string-in-object',
    },
    schema: [
      {
        type: 'object',
        properties: {
          include: {
            type: 'array',
            items: {type: 'string'},
            default: ['label'],
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      untranslatedProperty:
        'Object property: `{{propertyKey}}` might contain an untranslated literal string',
    },
  },
  defaultOptions: [],
  create(context) {
    const propertyVisitor = (node: TSESTree.Property) => {
      checkProperty(context, node)
    }

    const parserServices = getParserServices(context)
    //@ts-expect-error defineTemplateBodyVisitor exists in Vue parser
    if (parserServices?.defineTemplateBodyVisitor) {
      //@ts-expect-error
      return parserServices.defineTemplateBodyVisitor(
        {
          Property: propertyVisitor,
        },
        {
          Property: propertyVisitor,
        }
      )
    }
    return {
      Property: propertyVisitor,
    }
  },
}

function checkProperty(
  context: RuleContext<MessageIds, Options>,
  node: TSESTree.Property
) {
  const config: PropertyConfig = {
    include: ['label'],
    ...(context.options[0] || {}),
  }

  const propertyKey =
    node.key.type === TSESTree.AST_NODE_TYPES.Identifier
      ? node.key.name
      : node.key.type === TSESTree.AST_NODE_TYPES.Literal &&
          typeof node.key.value === 'string'
        ? node.key.value
        : null

  if (!propertyKey || !config.include.includes(propertyKey)) {
    return
  }

  checkPropertyValue(context, node.value, propertyKey)
}

function checkPropertyValue(
  context: RuleContext<MessageIds, Options>,
  node: TSESTree.Property['value'] | TSESTree.PrivateIdentifier,
  propertyKey: string
) {
  if (
    (node.type === 'Literal' &&
      typeof node.value === 'string' &&
      node.value.length > 0) ||
    (node.type === 'TemplateLiteral' &&
      (node.quasis.length > 1 || node.quasis[0].value.raw.length > 0))
  ) {
    context.report({
      node: node,
      messageId: 'untranslatedProperty',
      data: {
        propertyKey: propertyKey,
      },
    })
  } else if (node.type === 'BinaryExpression' && node.operator === '+') {
    checkPropertyValue(context, node.left, propertyKey)
    checkPropertyValue(context, node.right, propertyKey)
  } else if (node.type === 'ConditionalExpression') {
    checkPropertyValue(context, node.consequent, propertyKey)
    checkPropertyValue(context, node.alternate, propertyKey)
  } else if (node.type === 'LogicalExpression') {
    checkPropertyValue(context, node.left, propertyKey)
    checkPropertyValue(context, node.right, propertyKey)
  }
}
