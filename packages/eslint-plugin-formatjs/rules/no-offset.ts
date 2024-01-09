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

type MessageIds = 'noOffset'
type Options = []

function verifyAst(ast: MessageFormatElement[]) {
  const errors: {messageId: MessageIds; data: Record<string, unknown>}[] = []
  for (const el of ast) {
    if (isPluralElement(el)) {
      if (el.offset) {
        errors.push({messageId: 'noOffset', data: {}})
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
        node: messageNode,
        ...error,
      })
    }
  }
}

export const name = 'no-offset'

export const rule: RuleModule<MessageIds, Options, RuleListener> = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow offset in plural rules',
      url: 'https://formatjs.io/docs/tooling/linter#no-offset',
    },
    fixable: 'code',
    messages: {
      noOffset: 'offset is not allowed',
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
