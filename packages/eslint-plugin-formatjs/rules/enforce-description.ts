import {Rule} from 'eslint'
import {extractMessages} from '../util'
import {TSESTree} from '@typescript-eslint/typescript-estree'

function checkNode(context: Rule.RuleContext, node: TSESTree.Node) {
  const msgs = extractMessages(node, context.settings)
  const {
    options: [type],
  } = context
  for (const [
    {
      message: {description},
      descriptionNode,
    },
  ] of msgs) {
    if (!description) {
      if (type === 'literal' && descriptionNode) {
        context.report({
          node: descriptionNode as any,
          message:
            '`description` has to be a string literal (not function call or variable)',
        })
      } else if (!descriptionNode) {
        context.report({
          node: node as any,
          message: '`description` has to be specified in message descriptor',
        })
      }
    }
  }
}

export default {
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce description in message descriptor',
      category: 'Errors',
      recommended: false,
      url: 'https://formatjs.io/docs/tooling/linter#enforce-description',
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
} as Rule.RuleModule
