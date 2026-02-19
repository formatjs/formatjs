import {
  type MessageFormatElement,
  isPluralElement,
  parse,
} from '@formatjs/icu-messageformat-parser'
import type {Node} from 'estree-jsx'
import type {Rule} from 'eslint'
import {extractMessages, getSettings} from '../util.js'
import {CORE_MESSAGES, type CoreMessageIds} from '../messages.js'

type MessageIds = 'noMultiplePlurals' | CoreMessageIds

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

function checkNode(context: Rule.RuleContext, node: Node) {
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
        node,
        ...error,
      })
    }
  }
}

export const name = 'no-multiple-plurals'

export const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow multiple plural rules in the same message',
      url: 'https://formatjs.github.io/docs/tooling/linter#no-multiple-plurals',
    },
    fixable: 'code',
    schema: [],
    messages: {
      ...CORE_MESSAGES,
      noMultiplePlurals: 'Multiple plural rules in the same message',
    },
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
