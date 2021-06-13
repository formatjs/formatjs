import {Rule, SourceCode} from 'eslint'
import {extractMessages} from '../util'
import {TSESTree} from '@typescript-eslint/typescript-estree'
import * as ESTree from 'estree'

function isComment(
  token: ReturnType<SourceCode['getTokenAfter']>
): token is ESTree.Comment {
  return !!token && (token.type === 'Block' || token.type === 'Line')
}

function checkNode(context: Rule.RuleContext, node: TSESTree.Node) {
  const msgs = extractMessages(node, context.settings)
  for (const [{idPropNode}] of msgs) {
    if (idPropNode) {
      context.report({
        node: idPropNode as any,
        message: 'Manual `id` are not allowed in message descriptor',
        fix(fixer) {
          const src = context.getSourceCode()
          const token = src.getTokenAfter(idPropNode as any)
          const fixes = [fixer.remove(idPropNode as any)]
          if (token && !isComment(token) && token?.value === ',') {
            fixes.push(fixer.remove(token))
          }
          return fixes
        },
      })
    }
  }
}

export default {
  meta: {
    type: 'problem',
    docs: {
      description: 'Ban explicit ID from MessageDescriptor',
      category: 'Errors',
      recommended: false,
      url: 'https://formatjs.io/docs/tooling/linter#no-id',
    },
    fixable: 'code',
  },
  create(context) {
    const callExpressionVisitor = (node: TSESTree.Node) =>
      checkNode(context, node)

    if (context.parserServices.defineTemplateBodyVisitor) {
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
} as Rule.RuleModule
