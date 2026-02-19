import type {Comment, Node} from 'estree-jsx'
import type {Rule, SourceCode} from 'eslint'
import {extractMessages, getSettings} from '../util.js'

function isComment(
  token: ReturnType<SourceCode['getTokenAfter']>
): token is Comment {
  return !!token && (token.type === 'Block' || token.type === 'Line')
}

export const name = 'no-id'

function checkNode(context: Rule.RuleContext, node: Node) {
  const msgs = extractMessages(node, getSettings(context))
  for (const [{idPropNode}] of msgs) {
    if (idPropNode) {
      context.report({
        node: idPropNode,
        messageId: 'noId',
        fix(fixer) {
          const src = context.sourceCode
          const token = src.getTokenAfter(idPropNode)
          const fixes = [fixer.remove(idPropNode)]
          if (token && !isComment(token) && token?.value === ',') {
            fixes.push(fixer.remove(token))
          }
          return fixes
        },
      })
    }
  }
}

export const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Ban explicit ID from MessageDescriptor',
      url: 'https://formatjs.github.io/docs/tooling/linter#no-id',
    },
    fixable: 'code',
    schema: [],
    messages: {
      noId: 'Manual `id` are not allowed in message descriptor',
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
