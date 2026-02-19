import type {Node} from 'estree-jsx'
import type {Rule} from 'eslint'
import {
  extractEmojis,
  filterEmojis,
  hasEmoji,
  isValidEmojiVersion,
  type EmojiVersion,
} from '../emoji-utils.js'
import {extractMessages, getSettings} from '../util.js'

export const name = 'no-emoji'

type NoEmojiConfig = {versionAbove: string}
export type Options = [NoEmojiConfig?]

function checkNode(context: Rule.RuleContext, node: Node) {
  const msgs = extractMessages(node, getSettings(context))

  let versionAbove: EmojiVersion | undefined
  const [emojiConfig] = context.options

  if (
    emojiConfig?.versionAbove &&
    isValidEmojiVersion(emojiConfig.versionAbove)
  ) {
    versionAbove = emojiConfig.versionAbove as EmojiVersion
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
        const filter = filterEmojis(versionAbove)
        for (const emoji of extractEmojis(defaultMessage)) {
          // Check if the emoji's version is allowed (filterEmojis returns true for allowed emojis)
          if (!filter(emoji)) {
            context.report({
              node: messageNode,
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
          node: messageNode,
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
  '13.0',
  '14.0',
  '15.0',
  '16.0',
  '17.0',
]

export const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow emojis in message',
      url: 'https://formatjs.github.io/docs/tooling/linter#no-emoji',
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
