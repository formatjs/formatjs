import type {Node} from 'estree-jsx'
import type {Rule} from 'eslint'
import {checkPlaceholders} from '#packages/eslint-plugin-formatjs/placeholder-checks.js'
import {CORE_MESSAGES} from '#packages/eslint-plugin-formatjs/messages.js'

export const name = 'enforce-placeholders'

export const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Enforce that all messages with placeholders have enough passed-in values',
      url: 'https://formatjs.github.io/docs/tooling/linter#enforce-placeholders',
    },
    schema: [
      {
        type: 'object',
        properties: {
          ignoreList: {
            type: 'array',
            items: {
              type: 'string',
            },
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      ...CORE_MESSAGES,
      missingValue:
        'Missing value(s) for the following placeholder(s): {{list}}.',
      unusedValue: 'Value not used by the message.',
    },
  },
  create(context) {
    const callExpressionVisitor = (node: Node) =>
      checkPlaceholders(context, node)

    const parserServices = context.sourceCode.parserServices
    if (parserServices?.defineTemplateBodyVisitor) {
      return parserServices.defineTemplateBodyVisitor(
        {
          CallExpression: callExpressionVisitor,
        },
        {
          CallExpression: callExpressionVisitor,
        }
      )
    }
    return {
      JSXOpeningElement: (node: Node) => checkPlaceholders(context, node),
      CallExpression: callExpressionVisitor,
    }
  },
}
