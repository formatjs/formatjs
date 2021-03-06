import {Rule, Scope} from 'eslint'
import {ImportDeclaration, Node} from 'estree'
import {extractMessages} from '../util'
import {TSESTree} from '@typescript-eslint/typescript-estree'

function checkNode(
  context: Rule.RuleContext,
  node: Node,
  importedMacroVars: Scope.Variable[]
) {
  const msgs = extractMessages(node as TSESTree.Node, importedMacroVars)
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
          node: descriptionNode as Node,
          message:
            '`description` has to be a string literal (not function call or variable)',
        })
      } else if (!descriptionNode) {
        context.report({
          node,
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
    const callExpressionVisitor = (node: Node) =>
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
        const moduleName = (node as ImportDeclaration).source.value
        if (moduleName === 'react-intl') {
          importedMacroVars = context.getDeclaredVariables(node)
        }
      },
      JSXOpeningElement: (node: Node) =>
        checkNode(context, node, importedMacroVars),
      CallExpression: callExpressionVisitor,
    }
  },
} as Rule.RuleModule
