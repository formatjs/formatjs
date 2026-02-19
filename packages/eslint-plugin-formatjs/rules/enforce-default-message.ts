import type {Node} from 'estree-jsx'
import type {Rule} from 'eslint'
import {extractMessages, getSettings} from '../util.js'

export enum Option {
  literal = 'literal',
  anything = 'anything',
}

export const name = 'enforce-default-message'

function checkNode(context: Rule.RuleContext, node: Node) {
  const msgs = extractMessages(node, getSettings(context))
  const {
    options: [type],
  } = context
  for (const [
    {
      message: {defaultMessage},
      messageNode,
      messageDescriptorNode,
    },
  ] of msgs) {
    if (!defaultMessage) {
      if (type === 'literal' && messageNode) {
        context.report({
          node: messageNode,
          messageId: 'defaultMessageLiteral',
        })
      } else if (!messageNode) {
        context.report({
          node: messageDescriptorNode,
          messageId: 'defaultMessage',
        })
      }
    }
  }
}

export const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce defaultMessage in message descriptor',
      url: 'https://formatjs.github.io/docs/tooling/linter#enforce-default-message',
    },
    fixable: 'code',
    schema: [
      {
        type: 'string',
        enum: Object.keys(Option),
      },
    ],
    messages: {
      defaultMessageLiteral: `"defaultMessage" must be:
- a string literal or
- template literal without variable`,
      defaultMessage:
        '`defaultMessage` has to be specified in message descriptor',
    },
  },
  create(context) {
    const callExpressionVisitor = (node: Node) => checkNode(context, node)

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
      JSXOpeningElement: (node: Node) => checkNode(context, node),
      CallExpression: callExpressionVisitor,
    }
  },
}
