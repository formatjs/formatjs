import {TSESTree} from '@typescript-eslint/utils'
import {
  RuleContext,
  RuleModule,
  RuleListener,
} from '@typescript-eslint/utils/ts-eslint'
import {extractMessages, getSettings} from '../util'

export enum Option {
  literal = 'literal',
  anything = 'anything',
}

type MessageIds = 'enforceDescription' | 'enforceDescriptionLiteral'
type Options = [`${Option}`?]

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
      message: {description},
      descriptionNode,
    },
  ] of msgs) {
    if (!description) {
      if (type === 'literal' && descriptionNode) {
        context.report({
          node: descriptionNode,
          messageId: 'enforceDescriptionLiteral',
        })
      } else if (!descriptionNode) {
        context.report({
          node: node,
          messageId: 'enforceDescription',
        })
      }
    }
  }
}

export const name = 'enforce-description'

export const rule: RuleModule<MessageIds, Options, RuleListener> = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce description in message descriptor',
      url: 'https://formatjs.io/docs/tooling/linter#enforce-description',
    },
    fixable: 'code',
    schema: [
      {
        type: 'string',
        enum: Object.keys(Option),
      },
    ],
    messages: {
      enforceDescription:
        '`description` has to be specified in message descriptor',
      enforceDescriptionLiteral:
        '`description` has to be a string literal (not function call or variable)',
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
