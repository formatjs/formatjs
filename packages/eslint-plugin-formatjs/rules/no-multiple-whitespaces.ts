import {
  LiteralElement,
  MessageFormatElement,
  parse,
  TYPE,
} from '@formatjs/icu-messageformat-parser'
import {TSESTree} from '@typescript-eslint/typescript-estree'
import {Rule} from 'eslint'
import {extractMessages, getSettings, patchMessage} from '../util'

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

function checkNode(context: Rule.RuleContext, node: TSESTree.Node) {
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
        node: messageNode as any,
        message: e instanceof Error ? e.message : String(e),
      })
      return
    }

    if (!isAstValid(ast)) {
      const newMessage = patchMessage(messageNode, ast, trimMultiWhitespaces)
      context.report({
        node: messageNode as any,
        messageId: 'noMultipleWhitespaces',
        fix:
          newMessage !== null
            ? fixer => fixer.replaceText(messageNode as any, newMessage)
            : null,
      })
    }
  }
}

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Prevents usage of multiple consecutive whitespaces in message',
      category: 'Errors',
      recommended: false,
      url: 'https://formatjs.io/docs/tooling/linter#no-multiple-whitespaces',
    },
    messages: {
      noMultipleWhitespaces: 'Multiple consecutive whitespaces are not allowed',
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
