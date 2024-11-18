import {
  MessageFormatElement,
  isArgumentElement,
  isPluralElement,
  parse,
} from '@formatjs/icu-messageformat-parser'
import {TSESTree} from '@typescript-eslint/utils'
import {RuleContext, RuleModule} from '@typescript-eslint/utils/ts-eslint'
import {getParserServices} from '../context-compat'
import {extractMessages, getSettings} from '../util'

type MessageIds = 'camelcase'

export const name = 'no-camel-case'

const CAMEL_CASE_REGEX = /[A-Z]/

function verifyAst(ast: MessageFormatElement[]) {
  const errors: {messageId: MessageIds; data: Record<string, unknown>}[] = []
  for (const el of ast) {
    if (isArgumentElement(el)) {
      if (CAMEL_CASE_REGEX.test(el.value)) {
        errors.push({messageId: 'camelcase', data: {}})
      }
      continue
    }
    if (isPluralElement(el)) {
      if (CAMEL_CASE_REGEX.test(el.value)) {
        errors.push({messageId: 'camelcase', data: {}})
      }
      const {options} = el
      for (const selector of Object.keys(options)) {
        errors.push(...verifyAst(options[selector].value))
      }
    }
  }

  return errors
}

function checkNode(
  context: RuleContext<MessageIds, unknown[]>,
  node: TSESTree.Node
) {
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
    const errors = verifyAst(
      parse(defaultMessage, {
        ignoreTag: settings.ignoreTag,
      })
    )
    for (const error of errors) {
      context.report({
        node: messageNode,
        ...error,
      })
    }
  }
}

export const rule: RuleModule<MessageIds> = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow camel case placeholders in message',
      url: 'https://formatjs.github.io/docs/tooling/linter#no-camel-case',
    },
    fixable: 'code',
    schema: [],
    messages: {
      camelcase: 'Camel case arguments are not allowed',
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
