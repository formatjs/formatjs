import {
  isLiteralElement,
  isPluralElement,
  isSelectElement,
  isTagElement,
  type MessageFormatElement,
  parse,
} from '@formatjs/icu-messageformat-parser'
import type {Node} from 'estree-jsx'
import type {Rule} from 'eslint'
import MagicString from 'magic-string'
import {extractMessages, patchMessage} from '../util.js'
import {CORE_MESSAGES, type CoreMessageIds} from '../messages.js'

export const name = 'no-missing-icu-plural-one-placeholders'

export type MessageIds = 'noMissingIcuPluralOnePlaceholders' | CoreMessageIds

type MessagePatch =
  | {type: 'remove'; start: number; end: number}
  | {type: 'prependLeft'; index: number; content: string}
  | {type: 'update'; start: number; end: number; content: string}

function verifyAst(
  context: Rule.RuleContext,
  messageNode: Node,
  ast: MessageFormatElement[]
) {
  const patches: MessagePatch[] = []

  _verifyAstAndReplace(ast)

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
    root = true
  ) {
    for (const el of ast) {
      if (isPluralElement(el) && el.options['one']) {
        _verifyAstAndReplace(el.options['one'].value, false)
      } else if (isSelectElement(el)) {
        for (const {value} of Object.values(el.options)) {
          _verifyAstAndReplace(value, root)
        }
      } else if (isTagElement(el)) {
        _verifyAstAndReplace(el.children, root)
      } else if (!root && isLiteralElement(el)) {
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

function checkNode(context: Rule.RuleContext, node: Node) {
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

    let ast: MessageFormatElement[]
    try {
      ast = parse(defaultMessage, {captureLocation: true})
    } catch (e) {
      context.report({
        node: messageNode,
        messageId: 'parseError',
        data: {
          error: (e as Error).message,
        },
      })
      continue
    }

    verifyAst(context, messageNode, ast)
  }
}

export const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'We use `one {# item}` instead of `one {1 item}` in ICU messages as some locales use the `one` formatting for other similar numbers.',
      url: 'https://formatjs.github.io/docs/tooling/linter#no-explicit-icu-plural',
    },
    fixable: 'code',
    messages: {
      ...CORE_MESSAGES,
      noMissingIcuPluralOnePlaceholders:
        'Use `one {# item}` instead of `one {1 item}` in ICU messages.',
    },
    schema: [],
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
