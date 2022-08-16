import {Rule} from 'eslint'
import {TSESTree} from '@typescript-eslint/typescript-estree'
import {
  parse,
  isPluralElement,
  MessageFormatElement,
  isArgumentElement,
} from '@formatjs/icu-messageformat-parser'
import {extractMessages, getSettings} from '../util'

const CAMEL_CASE_REGEX = /[A-Z]/

class CamelCase extends Error {
  public message = 'Camel case arguments are not allowed'
}

function verifyAst(ast: MessageFormatElement[]) {
  for (const el of ast) {
    if (isArgumentElement(el)) {
      if (CAMEL_CASE_REGEX.test(el.value)) {
        throw new CamelCase()
      }
      continue
    }
    if (isPluralElement(el)) {
      if (CAMEL_CASE_REGEX.test(el.value)) {
        throw new CamelCase()
      }
      const {options} = el
      for (const selector of Object.keys(options)) {
        verifyAst(options[selector].value)
      }
    }
  }
}

function checkNode(context: Rule.RuleContext, node: TSESTree.Node) {
  const settings = getSettings(context)
  const msgs = extractMessages(node, settings)

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
          ignoreTag: settings.ignoreTag,
        })
      )
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
      description: 'Disallow camel case placeholders in message',
      category: 'Errors',
      recommended: false,
      url: 'https://formatjs.io/docs/tooling/linter#no-camel-case',
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
