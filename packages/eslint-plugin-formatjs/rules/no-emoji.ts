import {Rule} from 'eslint'
import {TSESTree} from '@typescript-eslint/typescript-estree'
import {extractMessages, getSettings} from '../util'
import {
  extractEmojis,
  filterEmojis,
  getAllEmojis,
  hasEmoji,
  isValidEmojiVersion,
  type EmojiVersion,
} from 'unicode-emoji-utils'

function checkNode(context: Rule.RuleContext, node: TSESTree.Node) {
  const msgs = extractMessages(node, getSettings(context))

  let allowedEmojis: string[] = []
  let versionAbove: EmojiVersion | undefined
  const [emojiConfig] = context.options

  if (
    emojiConfig?.versionAbove &&
    isValidEmojiVersion(emojiConfig.versionAbove) &&
    !versionAbove &&
    allowedEmojis.length === 0
  ) {
    versionAbove = emojiConfig.versionAbove as EmojiVersion
    allowedEmojis = getAllEmojis(filterEmojis(versionAbove))
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
    if (hasEmoji(defaultMessage)) {
      if (versionAbove) {
        for (const emoji of extractEmojis(defaultMessage)) {
          if (!allowedEmojis.includes(emoji)) {
            context.report({
              node: messageNode as any,
              messageId: 'notAllowedAboveVersion',
              data: {
                versionAbove,
                emoji,
              },
            })
          }
        }
      } else {
        context.report({
          node: messageNode as any,
          messageId: 'notAllowed',
        })
      }
    }
  }
}

const versionAboveEnums: EmojiVersion[] = [
  '0.6',
  '0.7',
  '1.0',
  '2.0',
  '3.0',
  '4.0',
  '5.0',
  '11.0',
  '12.0',
  '12.1',
  '13.0',
  '13.1',
  '14.0',
  '15.0',
]

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow emojis in message',
      category: 'Errors',
      recommended: false,
      url: 'https://formatjs.io/docs/tooling/linter#no-emoji',
    },
    fixable: 'code',
    schema: [
      {
        type: 'object',
        properties: {versionAbove: {type: 'string', enum: versionAboveEnums}},
        additionalProperties: false,
      },
    ],
    messages: {
      notAllowed: 'Emojis are not allowed',
      notAllowedAboveVersion:
        'Emojis above version {{versionAbove}} are not allowed - Emoji: {{emoji}}',
    },
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
