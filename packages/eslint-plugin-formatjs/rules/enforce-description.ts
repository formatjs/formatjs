import type {Node} from 'estree-jsx'
import type {Rule} from 'eslint'
import {extractMessages, getSettings} from '../util.js'

export enum Option {
  literal = 'literal',
  anything = 'anything',
}

function checkNode(context: Rule.RuleContext, node: Node) {
  const msgs = extractMessages(node, getSettings(context))
  const {
    options: [type],
  } = context
  for (const [
    {
      message: {description},
      descriptionNode,
      messageDescriptorNode,
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
          node: messageDescriptorNode,
          messageId: 'enforceDescription',
        })
      }
    }
  }
}

export const name = 'enforce-description'

export const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce description in message descriptor',
      url: 'https://formatjs.github.io/docs/tooling/linter#enforce-description',
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
