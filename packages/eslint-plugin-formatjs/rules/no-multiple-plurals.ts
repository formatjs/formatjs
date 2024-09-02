import {
  MessageFormatElement,
  isPluralElement,
  parse,
} from '@formatjs/icu-messageformat-parser'
import {TSESTree} from '@typescript-eslint/utils'
import {
  RuleContext,
  RuleModule,
  RuleListener,
} from '@typescript-eslint/utils/ts-eslint'
import {extractMessages, getSettings} from '../util'
import {getParserServices} from '../context-compat'

type MessageIds = 'noMultiplePlurals'
type Options = []

function verifyAst(ast: MessageFormatElement[], pluralCount = {count: 0}) {
  const errors: {messageId: MessageIds; data: Record<string, unknown>}[] = []
  for (const el of ast) {
    if (isPluralElement(el)) {
      pluralCount.count++
      if (pluralCount.count > 1) {
        errors.push({messageId: 'noMultiplePlurals', data: {}})
      }
      const {options} = el
      for (const selector of Object.keys(options)) {
        errors.push(...verifyAst(options[selector].value, pluralCount))
      }
    }
  }

  return errors
}

function checkNode(
  context: RuleContext<MessageIds, Options>,
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
        node,
        ...error,
      })
    }
  }
}

export const name = 'no-multiple-plurals'

export const rule: RuleModule<MessageIds, Options, {}, RuleListener> = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow multiple plural rules in the same message',
      url: 'https://formatjs.io/docs/tooling/linter#no-multiple-plurals',
    },
    fixable: 'code',
    schema: [],
    messages: {
      noMultiplePlurals: 'Multiple plural rules in the same message',
    },
  },
  defaultOptions: [],
  create(context) {
    const callExpressionVisitor = (node: TSESTree.Node) =>
      checkNode(context, node)

    //@ts-expect-error defineTemplateBodyVisitor exists in Vue parser
    if (getParserServices(context).defineTemplateBodyVisitor) {
      //@ts-expect-error
      return getParserServices(context).defineTemplateBodyVisitor(
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
