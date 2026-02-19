import {
  type MessageFormatElement,
  parse,
  TYPE,
} from '@formatjs/icu-messageformat-parser'
import type {Node} from 'estree-jsx'
import type {Rule} from 'eslint'
import {extractMessages, getSettings} from '../util.js'
import {CORE_MESSAGES, type CoreMessageIds} from '../messages.js'
type MessageIds =
  | 'unnecessaryFormat'
  | 'unnecessaryFormatNumber'
  | 'unnecessaryFormatDate'
  | 'unnecessaryFormatTime'
  | CoreMessageIds

function verifyAst(ast: MessageFormatElement[]): MessageIds | undefined {
  if (ast.length !== 1) {
    return
  }

  switch (ast[0]!.type) {
    case TYPE.argument:
      return 'unnecessaryFormat'
    case TYPE.number:
      return 'unnecessaryFormatNumber'
    case TYPE.date:
      return 'unnecessaryFormatDate'
    case TYPE.time:
      return 'unnecessaryFormatTime'
  }
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
    const messageId = verifyAst(ast)

    if (messageId)
      context.report({
        node: messageNode,
        messageId,
      })
  }
}

export const name = 'no-useless-message'

export const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow unnecessary formatted message',
      url: 'https://formatjs.github.io/docs/tooling/linter#no-useless-message',
    },
    fixable: 'code',
    schema: [],
    messages: {
      ...CORE_MESSAGES,
      unnecessaryFormat: 'Unnecessary formatted message.',
      unnecessaryFormatNumber:
        'Unnecessary formatted message: just use FormattedNumber or intl.formatNumber.',
      unnecessaryFormatDate:
        'Unnecessary formatted message: just use FormattedDate or intl.formatDate.',
      unnecessaryFormatTime:
        'Unnecessary formatted message: just use FormattedTime or intl.formatTime.',
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
