import {TSESTree} from '@typescript-eslint/utils'
import {
  RuleContext,
  RuleModule,
  SourceCode,
} from '@typescript-eslint/utils/ts-eslint'
import {getParserServices} from '../context-compat'
import {extractMessages, getSettings} from '../util'

function isComment(
  token: ReturnType<SourceCode['getTokenAfter']>
): token is TSESTree.Comment {
  return !!token && (token.type === 'Block' || token.type === 'Line')
}

type MessageIds = 'noId'

export const name = 'no-id'

function checkNode(
  context: RuleContext<MessageIds, unknown[]>,
  node: TSESTree.Node
) {
  const msgs = extractMessages(node, getSettings(context))
  for (const [{idPropNode}] of msgs) {
    if (idPropNode) {
      context.report({
        node: idPropNode,
        messageId: 'noId',
        fix(fixer) {
          const src = context.getSourceCode()
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

export const rule: RuleModule<MessageIds> = {
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
