import type {Property, PrivateIdentifier} from 'estree-jsx'
import type {Rule} from 'eslint'

type PropertyConfig = {
  include: string[]
}

export const name = 'no-literal-string-in-object'

export const rule: Rule.RuleModule = {
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
  create(context) {
    const propertyVisitor = (node: Property) => {
      checkProperty(context, node)
    }

    const parserServices = context.sourceCode.parserServices
    if (parserServices?.defineTemplateBodyVisitor) {
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

function checkProperty(context: Rule.RuleContext, node: Property) {
  const config: PropertyConfig = {
    include: ['label'],
    ...context.options[0],
  }

  const propertyKey =
    node.key.type === 'Identifier'
      ? node.key.name
      : node.key.type === 'Literal' && typeof node.key.value === 'string'
        ? node.key.value
        : null

  if (!propertyKey || !config.include.includes(propertyKey)) {
    return
  }

  checkPropertyValue(context, node.value, propertyKey)
}

function checkPropertyValue(
  context: Rule.RuleContext,
  node: Property['value'] | PrivateIdentifier,
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
      node,
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
