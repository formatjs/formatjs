import {
  RuleContext,
  RuleListener,
  RuleModule,
} from '@typescript-eslint/utils/ts-eslint'
import {TSESTree} from '@typescript-eslint/utils'
import MagicString from 'magic-string'
import {extractMessages, patchMessage} from '../util'
import {
  isLiteralElement,
  isPluralElement,
  isSelectElement,
  isTagElement,
  MessageFormatElement,
  parse,
} from '@formatjs/icu-messageformat-parser'

export const name = 'no-missing-icu-plural-one-placeholders'

export type MessageIds = 'noMissingIcuPluralOnePlaceholders'
type Options = []

type MessagePatch =
  | {type: 'remove'; start: number; end: number}
  | {type: 'prependLeft'; index: number; content: string}
  | {type: 'update'; start: number; end: number; content: string}

function verifyAst(
  context: RuleContext<MessageIds, Options>,
  messageNode: TSESTree.Node,
  ast: MessageFormatElement[]
) {
  const patches: MessagePatch[] = []

  _verifyAstAndReplace(ast, false)

  if (patches.length > 0) {
    const patchedMessage = patchMessage(messageNode, ast, content => {
      return patches
        .reduce((magicString, patch) => {
          switch (patch.type) {
            case 'prependLeft':
              return magicString.prependLeft(patch.index, patch.content)
            case 'remove':
              return magicString.remove(patch.start, patch.end)
            case 'update':
              return magicString.update(patch.start, patch.end, patch.content)
          }
        }, new MagicString(content))
        .toString()
    })

    context.report({
      node: messageNode,
      messageId: 'noMissingIcuPluralOnePlaceholders',
      fix:
        patchedMessage !== null
          ? fixer => fixer.replaceText(messageNode, patchedMessage)
          : null,
    })
  }

  function _verifyAstAndReplace(
    ast: readonly MessageFormatElement[],
    inner = true
  ) {
    for (const el of ast) {
      if (isPluralElement(el) && el.options['one']) {
        _verifyAstAndReplace(el.options['one'].value)
      } else if (isSelectElement(el)) {
        for (const {value} of Object.values(el.options)) {
          _verifyAstAndReplace(value)
        }
      } else if (isTagElement(el)) {
        _verifyAstAndReplace(el.children)
      } else if (inner && isLiteralElement(el)) {
        const match = el.value.match(/\b1\b/)
        if (match && el.location) {
          patches.push({
            type: 'update',
            start: el.location!.start.offset,
            end: el.location!.end.offset,
            content: el.value.replace(match[0], '#'),
          })
        }
      }
    }
  }
}

function checkNode(
  context: RuleContext<MessageIds, Options>,
  node: TSESTree.Node
) {
  const msgs = extractMessages(node)

  for (const [
    {
      message: {defaultMessage},
      messageNode,
    },
  ] of msgs) {
    if (!defaultMessage || !messageNode) {
      continue
    }

    verifyAst(
      context,
      messageNode,
      parse(defaultMessage, {captureLocation: true})
    )
  }
}

export const rule: RuleModule<MessageIds, Options, RuleListener> = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'We use `one {# item}` instead of `one {1 item}` in ICU messages as some locales use the `one` formatting for other similar numbers.',
      url: 'https://formatjs.io/docs/tooling/linter#no-explicit-icu-plural',
    },
    fixable: 'code',
    messages: {
      noMissingIcuPluralOnePlaceholders:
        'Use `one {# item}` instead of `one {1 item}` in ICU messages.',
    },
    schema: [],
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
