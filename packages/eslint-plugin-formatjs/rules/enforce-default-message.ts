import {TSESTree} from '@typescript-eslint/utils'
import {RuleContext, RuleModule} from '@typescript-eslint/utils/ts-eslint'
import {getParserServices} from '../context-compat'
import {extractMessages, getSettings} from '../util'

export enum Option {
  literal = 'literal',
  anything = 'anything',
}

type MessageIds = 'defaultMessage' | 'defaultMessageLiteral'
type Options = [`${Option}`?]

export const name = 'enforce-default-message'

function checkNode(
  context: RuleContext<MessageIds, Options>,
  node: TSESTree.Node
) {
  const msgs = extractMessages(node, getSettings(context))
  const {
    options: [type],
  } = context
  for (const [
    {
      message: {defaultMessage},
      messageNode,
    },
  ] of msgs) {
    if (!defaultMessage) {
      if (type === 'literal' && messageNode) {
        context.report({
          node: messageNode,
          messageId: 'defaultMessageLiteral',
        })
      } else if (!messageNode) {
        context.report({
          node: node,
          messageId: 'defaultMessage',
        })
      }
    }
  }
}

export const rule: RuleModule<MessageIds, Options> = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce defaultMessage in message descriptor',
      url: 'https://formatjs.github.io/docs/tooling/linter#enforce-default-message',
    },
    fixable: 'code',
    schema: [
      {
        type: 'string',
        enum: Object.keys(Option),
      },
    ],
    messages: {
      defaultMessageLiteral: `"defaultMessage" must be:
- a string literal or
- template literal without variable`,
      defaultMessage:
        '`defaultMessage` has to be specified in message descriptor',
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
