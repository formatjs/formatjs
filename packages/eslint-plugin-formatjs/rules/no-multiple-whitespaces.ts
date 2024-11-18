import {
  LiteralElement,
  MessageFormatElement,
  parse,
  TYPE,
} from '@formatjs/icu-messageformat-parser'
import {TSESTree} from '@typescript-eslint/utils'
import {RuleContext, RuleModule} from '@typescript-eslint/utils/ts-eslint'
import {getParserServices} from '../context-compat'
import {extractMessages, getSettings, patchMessage} from '../util'

type MessageIds = 'noMultipleWhitespaces' | 'parserError'

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
      case TYPE.literal:
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
        case TYPE.literal:
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

function checkNode(
  context: RuleContext<MessageIds, unknown[]>,
  node: TSESTree.Node
) {
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
        messageId: 'parserError',
        data: {message: e instanceof Error ? e.message : String(e)},
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

export const rule: RuleModule<MessageIds> = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Prevents usage of multiple consecutive whitespaces in message',
      url: 'https://formatjs.github.io/docs/tooling/linter#no-multiple-whitespaces',
    },
    messages: {
      noMultipleWhitespaces: 'Multiple consecutive whitespaces are not allowed',
      parserError: '{{message}}',
    },
    fixable: 'code',
    schema: [],
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
