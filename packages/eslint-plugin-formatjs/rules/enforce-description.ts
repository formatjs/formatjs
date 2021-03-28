import {Rule, Scope} from 'eslint'
import {extractMessages} from '../util'
import {TSESTree} from '@typescript-eslint/typescript-estree'

function checkNode(
  context: Rule.RuleContext,
  node: TSESTree.Node,
  importedMacroVars: Scope.Variable[]
) {
  const msgs = extractMessages(node, importedMacroVars)
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
          node: descriptionNode as any,
          message:
            '`description` has to be a string literal (not function call or variable)',
        })
      } else if (!descriptionNode) {
        context.report({
          node: node as any,
          message: '`description` has to be specified in message descriptor',
        })
      }
    }
  }
}

export default {
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce description in message descriptor',
      category: 'Errors',
      recommended: false,
      url: 'https://formatjs.io/docs/tooling/linter#enforce-description',
    },
    fixable: 'code',
    schema: [
      {
        enum: ['literal', 'anything'],
      },
    ],
  },
  create(context) {
    let importedMacroVars: Scope.Variable[] = []
    const callExpressionVisitor = (node: TSESTree.Node) =>
      checkNode(context, node, importedMacroVars)

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
      ImportDeclaration: node => {
        const moduleName = node.source.value
        if (moduleName === 'react-intl') {
          importedMacroVars = context.getDeclaredVariables(node)
        }
      },
      JSXOpeningElement: (node: TSESTree.Node) =>
        checkNode(context, node, importedMacroVars),
      CallExpression: callExpressionVisitor,
    }
  },
} as Rule.RuleModule
