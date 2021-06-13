import {Rule} from 'eslint'
import {extractMessages} from '../util'
import {TSESTree} from '@typescript-eslint/typescript-estree'
const MULTIPLE_SPACES = /\s{2,}/g

function checkNode(context: Rule.RuleContext, node: TSESTree.Node) {
  const msgs = extractMessages(node, context.settings)

  for (const [
    {
      message: {defaultMessage},
      messageNode,
    },
  ] of msgs) {
    if (!defaultMessage || !messageNode) {
      continue
    }
    if (MULTIPLE_SPACES.test(defaultMessage)) {
      const reportObject: Parameters<typeof context['report']>[0] = {
        node: messageNode as any,
        message: 'Multiple consecutive whitespaces are not allowed',
      }
      if (messageNode.type === 'Literal' && messageNode.raw) {
        reportObject.fix = function (fixer) {
          return fixer.replaceText(
            messageNode as any,
            messageNode.raw!.replace(MULTIPLE_SPACES, ' ')
          )
        }
      }
      context.report(reportObject)
    }
  }
}

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow emojis in message',
      category: 'Errors',
      recommended: false,
      url: 'https://formatjs.io/docs/tooling/linter#no-emoji',
    },
    fixable: 'whitespace',
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
