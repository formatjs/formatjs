import {Rule, Scope} from 'eslint';
import {ImportDeclaration, Node} from 'estree';
import {extractMessages} from '../util';
import {TSESTree} from '@typescript-eslint/typescript-estree';

function checkNode(
  context: Rule.RuleContext,
  node: Node,
  importedMacroVars: Scope.Variable[]
) {
  const msgs = extractMessages(node as TSESTree.Node, importedMacroVars);
  const {
    options: [type],
  } = context;
  for (const [
    {
      message: {defaultMessage},
      messageNode,
    },
  ] of msgs) {
    if (!defaultMessage) {
      if (type === 'literal' && messageNode) {
        context.report({
          node: messageNode as Node,
          message: `"defaultMessage" must be:
- a string literal or
- template literal without variable`,
        });
      } else if (!messageNode) {
        context.report({
          node,
          message: '`defaultMessage` has to be specified in message descriptor',
        });
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
    let importedMacroVars: Scope.Variable[] = [];
    const callExpressionVisitor = (node: Node) =>
      checkNode(context, node, importedMacroVars);

    if (context.parserServices.defineTemplateBodyVisitor) {
      return context.parserServices.defineTemplateBodyVisitor(
        {
          CallExpression: callExpressionVisitor,
        },
        {
          CallExpression: callExpressionVisitor,
        }
      );
    }
    return {
      ImportDeclaration: node => {
        const moduleName = (node as ImportDeclaration).source.value;
        if (moduleName === 'react-intl') {
          importedMacroVars = context.getDeclaredVariables(node);
        }
      },
      JSXOpeningElement: (node: Node) =>
        checkNode(context, node, importedMacroVars),
      CallExpression: callExpressionVisitor,
    };
  },
};

export default rule;
