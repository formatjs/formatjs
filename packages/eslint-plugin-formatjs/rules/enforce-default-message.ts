import {Rule} from 'eslint'
import {extractMessages, getSettings} from '../util'
import {TSESTree} from '@typescript-eslint/typescript-estree'

function checkNode(context: Rule.RuleContext, node: TSESTree.Node) {
  const msgs = extractMessages(node, getSettings(context))
  const {
    options: [type],
  } = context
  for (const [
    {
      message: {defaultMessage},
      messageNode,
    },
  ] of msgs) {
    if (!defaultMessage) {
      if (type === 'literal' && messageNode) {
        context.report({
          node: messageNode as any,
          message: `"defaultMessage" must be:
- a string literal or
- template literal without variable`,
        })
      } else if (!messageNode) {
        context.report({
          node: node as any,
          message: '`defaultMessage` has to be specified in message descriptor',
        })
      }
    }
  }
}

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce defaultMessage in message descriptor',
      category: 'Errors',
      recommended: false,
      url: 'https://formatjs.io/docs/tooling/linter#enforce-default-message',
    },
    fixable: 'code',
    schema: [
      {
        enum: ['literal', 'anything'],
      },
    ],
  },
  create(context) {
    const callExpressionVisitor = (node: TSESTree.Node) =>
      checkNode(context, node)

    if (context.parserServices.defineTemplateBodyVisitor) {
      return context.parserServices.defineTemplateBodyVisitor(
        {
          CallExpression: callExpressionVisitor,
        },
        {
          CallExpression: callExpressionVisitor,
        }
      )
    }
    return {
      JSXOpeningElement: (node: TSESTree.Node) => checkNode(context, node),
      CallExpression: callExpressionVisitor,
    }
  },
}

export default rule
