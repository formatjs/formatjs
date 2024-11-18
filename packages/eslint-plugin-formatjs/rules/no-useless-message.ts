import {
  MessageFormatElement,
  parse,
  TYPE,
} from '@formatjs/icu-messageformat-parser'
import {TSESTree} from '@typescript-eslint/utils'
import {RuleContext, RuleModule} from '@typescript-eslint/utils/ts-eslint'
import {getParserServices} from '../context-compat'
import {extractMessages, getSettings} from '../util'

type MessageIds =
  | 'unnecessaryFormat'
  | 'unnecessaryFormatNumber'
  | 'unnecessaryFormatDate'
  | 'unnecessaryFormatTime'

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
    const messageId = verifyAst(
      parse(defaultMessage, {
        ignoreTag: settings.ignoreTag,
      })
    )

    if (messageId)
      context.report({
        node: messageNode,
        messageId,
      })
  }
}

export const name = 'no-useless-message'

export const rule: RuleModule<MessageIds> = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow unnecessary formatted message',
      url: 'https://formatjs.github.io/docs/tooling/linter#no-useless-message',
    },
    fixable: 'code',
    schema: [],
    messages: {
      unnecessaryFormat: 'Unnecessary formatted message.',
      unnecessaryFormatNumber:
        'Unnecessary formatted message: just use FormattedNumber or intl.formatNumber.',
      unnecessaryFormatDate:
        'Unnecessary formatted message: just use FormattedDate or intl.formatDate.',
      unnecessaryFormatTime:
        'Unnecessary formatted message: just use FormattedTime or intl.formatTime.',
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
