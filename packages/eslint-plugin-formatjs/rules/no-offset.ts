import {
  MessageFormatElement,
  isPluralElement,
  parse,
} from '@formatjs/icu-messageformat-parser'
import {TSESTree} from '@typescript-eslint/utils'
import {RuleContext, RuleModule} from '@typescript-eslint/utils/ts-eslint'
import {getParserServices} from '../context-compat.js'
import {extractMessages, getSettings} from '../util.js'
import {CORE_MESSAGES, CoreMessageIds} from '../messages.js'

type MessageIds = 'noOffset' | CoreMessageIds

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
    let ast: MessageFormatElement[]
    try {
      ast = parse(defaultMessage, {
        ignoreTag: settings.ignoreTag,
      })
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
    const errors = verifyAst(ast)
    for (const error of errors) {
      context.report({
        node: messageNode,
        ...error,
      })
    }
  }
}

export const name = 'no-offset'

export const rule: RuleModule<MessageIds> = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow offset in plural rules',
      url: 'https://formatjs.github.io/docs/tooling/linter#no-offset',
    },
    fixable: 'code',
    messages: {
      ...CORE_MESSAGES,
      noOffset: 'offset is not allowed',
    },
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
