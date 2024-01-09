import {
  MessageFormatElement,
  parse,
  TYPE,
} from '@formatjs/icu-messageformat-parser'
import {TSESTree} from '@typescript-eslint/utils'
import {
  RuleContext,
  RuleModule,
  RuleListener,
} from '@typescript-eslint/utils/ts-eslint'
import {extractMessages, getSettings} from '../util'

type MessageIds =
  | 'unnecessaryFormat'
  | 'unnecessaryFormatNumber'
  | 'unnecessaryFormatDate'
  | 'unnecessaryFormatTime'
type Options = []

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

export const rule: RuleModule<MessageIds, Options, RuleListener> = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow unnecessary formatted message',
      recommended: 'recommended',
      url: 'https://formatjs.io/docs/tooling/linter#no-useless-message',
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
