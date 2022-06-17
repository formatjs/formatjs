import {Rule} from 'eslint'
import {extractMessages} from '../util'
import {TSESTree} from '@typescript-eslint/typescript-estree'
import {
  parse,
  MessageFormatElement,
  TYPE,
} from '@formatjs/icu-messageformat-parser'

class MultipleWhitespacesError extends Error {
  public message = 'Multiple consecutive whitespaces are not allowed'
}

function verifyAst(ast: MessageFormatElement[]): void {
  for (const element of ast) {
    switch (element.type) {
      case TYPE.literal:
        if (/\s{2,}/gm.test(element.value)) {
          throw new MultipleWhitespacesError()
        }
        break
      case TYPE.argument:
      case TYPE.date:
      case TYPE.literal:
      case TYPE.number:
      case TYPE.pound:
      case TYPE.tag:
      case TYPE.time:
        break
      case TYPE.plural:
      case TYPE.select: {
        for (const option of Object.values(element.options)) {
          verifyAst(option.value)
        }
        break
      }
    }
  }
}

function checkNode(context: Rule.RuleContext, node: TSESTree.Node) {
  const msgs = extractMessages(node, context.settings)

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
      verifyAst(parse(defaultMessage))
    } catch (e) {
      context.report({
        node: messageNode as any,
        message: e instanceof Error ? e.message : String(e),
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
