import {parse} from '@formatjs/icu-messageformat-parser'
import type {Node} from 'estree-jsx'
import type {Rule} from 'eslint'
import {extractMessages, getSettings} from '../util.js'
import {CORE_MESSAGES} from '../messages.js'

export const name = 'no-invalid-icu'

function checkNode(context: Rule.RuleContext, node: Node) {
  const settings = getSettings(context)
  let msgs
  try {
    msgs = extractMessages(node, settings)
  } catch (e) {
    // GH #5069: Handle errors from extractMessages (e.g., tagged templates with substitutions)
    context.report({
      node,
      messageId: 'parseError',
      data: {
        error: (e as Error).message,
      },
    })
    return
  }

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
      context.report({
        node: messageNode,
        messageId: 'parseError',
        data: {
          error: (e as Error).message,
        },
      })
    }
  }
}

export const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: `Make sure ICU messages are formatted correctly with no bad select statements, plurals, etc.`,
    },
    fixable: 'code',
    schema: [],
    messages: CORE_MESSAGES,
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
