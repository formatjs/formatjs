import {
  type LiteralElement,
  type MessageFormatElement,
  parse,
  TYPE,
} from '@formatjs/icu-messageformat-parser'
import type {Node} from 'estree-jsx'
import type {Rule} from 'eslint'
import {extractMessages, getSettings, patchMessage} from '../util.js'
import {CORE_MESSAGES} from '../messages.js'

function isAstValid(ast: MessageFormatElement[]): boolean {
  for (const element of ast) {
    switch (element.type) {
      case TYPE.literal:
        if (/\s{2,}/gm.test(element.value)) {
          return false
        }
        break
      case TYPE.argument:
      case TYPE.date:
      case TYPE.number:
      case TYPE.pound:
      case TYPE.time:
        break
      case TYPE.plural:
      case TYPE.select: {
        for (const option of Object.values(element.options)) {
          if (!isAstValid(option.value)) {
            return false
          }
        }
        break
      }
      case TYPE.tag:
        return isAstValid(element.children)
    }
  }
  return true
}

function trimMultiWhitespaces(
  message: string,
  ast: MessageFormatElement[]
): string {
  const literalElements: LiteralElement[] = []

  const collectLiteralElements = (elements: MessageFormatElement[]) => {
    for (const element of elements) {
      switch (element.type) {
        case TYPE.literal:
          literalElements.push(element)
          break
        case TYPE.argument:
        case TYPE.date:
        case TYPE.number:
        case TYPE.pound:
        case TYPE.time:
          break
        case TYPE.plural:
        case TYPE.select: {
          for (const option of Object.values(element.options)) {
            collectLiteralElements(option.value)
          }
          break
        }
        case TYPE.tag:
          collectLiteralElements(element.children)
          break
      }
    }
  }
  collectLiteralElements(ast)

  // Surgically trim whitespaces in the literal element ranges.
  // This is to preserve the original whitespaces and newlines info that are lost to parsing.
  let trimmedFragments: string[] = []
  let currentOffset = 0

  for (const literal of literalElements) {
    const {start, end} = literal.location!
    const startOffset = start.offset
    const endOffset = end.offset

    trimmedFragments.push(message.slice(currentOffset, startOffset))
    trimmedFragments.push(
      message.slice(startOffset, endOffset).replace(/\s{2,}/gm, ' ')
    )

    currentOffset = endOffset
  }

  trimmedFragments.push(message.slice(currentOffset))

  return trimmedFragments.join('')
}

function checkNode(context: Rule.RuleContext, node: Node) {
  const msgs = extractMessages(node, getSettings(context))

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
        data: {error: e instanceof Error ? e.message : String(e)},
      })
      return
    }

    if (!isAstValid(ast)) {
      const newMessage = patchMessage(messageNode, ast, trimMultiWhitespaces)
      context.report({
        node: messageNode,
        messageId: 'noMultipleWhitespaces',
        fix:
          newMessage !== null
            ? fixer => fixer.replaceText(messageNode, newMessage)
            : null,
      })
    }
  }
}

export const name = 'no-multiple-whitespaces'

export const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Prevents usage of multiple consecutive whitespaces in message',
      url: 'https://formatjs.github.io/docs/tooling/linter#no-multiple-whitespaces',
    },
    messages: {
      ...CORE_MESSAGES,
      noMultipleWhitespaces: 'Multiple consecutive whitespaces are not allowed',
    },
    fixable: 'code',
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
