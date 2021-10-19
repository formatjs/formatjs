import {Rule} from 'eslint'
import {TSESTree} from '@typescript-eslint/typescript-estree'
import {extractMessages} from '../util'
import {
  parse,
  isPluralElement,
  MessageFormatElement,
} from '@formatjs/icu-messageformat-parser'

class NoOffsetError extends Error {
  public message = 'offset are not allowed in plural rules'
}

function verifyAst(ast: MessageFormatElement[]) {
  for (const el of ast) {
    if (isPluralElement(el)) {
      if (el.offset) {
        throw new NoOffsetError()
      }
      const {options} = el
      for (const selector of Object.keys(options)) {
        verifyAst(options[selector].value)
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
      verifyAst(
        parse(defaultMessage, {
          ignoreTag: context.settings.ignoreTag,
        })
      )
    } catch (e) {
      context.report({
        node: messageNode as any,
        message: (e as Error).message,
      })
    }
  }
}

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow offset in plural rules',
      category: 'Errors',
      recommended: false,
      url: 'https://formatjs.io/docs/tooling/linter#no-offset',
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
