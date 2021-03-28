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
      message: {defaultMessage},
      messageNode,
    },
  ] of msgs) {
    if (!defaultMessage) {
      if (type === 'literal' && messageNode) {
        context.report({
          node: messageNode as any,
          message: `"defaultMessage" must be:
- a string literal or
- template literal without variable`,
        })
      } else if (!messageNode) {
        context.report({
          node: node as any,
          message: '`defaultMessage` has to be specified in message descriptor',
        })
      }
    }
  }
}

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce defaultMessage in message descriptor',
      category: 'Errors',
      recommended: false,
      url: 'https://formatjs.io/docs/tooling/linter#enforce-default-message',
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
}

export default rule
