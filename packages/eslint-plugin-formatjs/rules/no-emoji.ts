import {TSESTree} from '@typescript-eslint/utils'
import {RuleContext, RuleModule} from '@typescript-eslint/utils/ts-eslint'
import {
  extractEmojis,
  filterEmojis,
  getAllEmojis,
  hasEmoji,
  isValidEmojiVersion,
  type EmojiVersion,
} from 'unicode-emoji-utils'
import {getParserServices} from '../context-compat'
import {extractMessages, getSettings} from '../util'

export const name = 'no-emoji'
type MessageIds = 'notAllowed' | 'notAllowedAboveVersion'

type NoEmojiConfig = {versionAbove: string}
export type Options = [NoEmojiConfig?]

function checkNode(
  context: RuleContext<MessageIds, Options>,
  node: TSESTree.Node
) {
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
  '12.1',
  '13.0',
  '13.1',
  '14.0',
  '15.0',
]

export const rule: RuleModule<MessageIds, Options> = {
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
  defaultOptions: [],
  create(context) {
    const callExpressionVisitor = (node: TSESTree.Node) =>
      checkNode(context, node)

    const parserServices = getParserServices(context)
    //@ts-expect-error defineTemplateBodyVisitor exists in Vue parser
    if (parserServices?.defineTemplateBodyVisitor) {
      //@ts-expect-error
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
      JSXOpeningElement: (node: TSESTree.Node) => checkNode(context, node),
      CallExpression: callExpressionVisitor,
    }
  },
}
