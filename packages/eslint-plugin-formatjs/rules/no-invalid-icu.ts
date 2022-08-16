import {Rule} from 'eslint'
import {TSESTree} from '@typescript-eslint/typescript-estree'
import {parse} from '@formatjs/icu-messageformat-parser'
import {extractMessages, getSettings} from '../util'

function checkNode(context: Rule.RuleContext, node: TSESTree.Node) {
  const settings = getSettings(context)
  const msgs = extractMessages(node, settings)

  if (!msgs.length) {
    return
  }

  for (const [
    {
      message: {defaultMessage},
      messageNode,
    },
  ] of msgs) {
    if (!defaultMessage || !messageNode) {
      continue
    }

    try {
      parse(defaultMessage, {
        ignoreTag: settings.ignoreTag,
      })
    } catch (e) {
      const msg = e instanceof Error ? e.message : e
      context.report({
        node: messageNode as any,
        message: `Error parsing ICU string: ${msg}`,
      })
    }
  }
}

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: `Make sure ICU messages are formatted correctly with no bad select statements, plurals, etc.`,
      category: 'Errors',
      recommended: true,
    },
    fixable: 'code',
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
