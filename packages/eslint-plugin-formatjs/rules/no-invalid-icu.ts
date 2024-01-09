import {parse} from '@formatjs/icu-messageformat-parser'
import {TSESTree} from '@typescript-eslint/utils'
import {
  RuleContext,
  RuleModule,
  RuleListener,
} from '@typescript-eslint/utils/ts-eslint'
import {extractMessages, getSettings} from '../util'

type MessageIds = 'icuError'
type Options = []

export const name = 'no-invalid-icu'

function checkNode(
  context: RuleContext<MessageIds, Options>,
  node: TSESTree.Node
) {
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
        node: messageNode,
        messageId: 'icuError',
        data: {message: `Error parsing ICU string: ${msg}`},
      })
    }
  }
}

export const rule: RuleModule<MessageIds, Options, RuleListener> = {
  meta: {
    type: 'problem',
    docs: {
      description: `Make sure ICU messages are formatted correctly with no bad select statements, plurals, etc.`,
    },
    fixable: 'code',
    schema: [],
    messages: {
      icuError: 'Invalid ICU Message format: {{message}}',
    },
  },
  defaultOptions: [],
  create(context) {
    const callExpressionVisitor = (node: TSESTree.Node) =>
      checkNode(context, node)

    //@ts-expect-error defineTemplateBodyVisitor exists in Vue parser
    if (context.parserServices.defineTemplateBodyVisitor) {
      //@ts-expect-error
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
