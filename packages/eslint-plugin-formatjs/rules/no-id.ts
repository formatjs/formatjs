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
  for (const [{idPropNode}] of msgs) {
    if (idPropNode) {
      context.report({
        node: idPropNode as Node,
        message: 'Manual `id` are not allowed in message descriptor',
        fix(fixer) {
          const src = context.getSourceCode();
          const token = src.getTokenAfter(idPropNode as any);
          const fixes = [fixer.remove(idPropNode as any)];
          if (token?.value === ',') {
            fixes.push(fixer.remove(token));
          }
          return fixes;
        },
      });
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
    let importedMacroVars: Scope.Variable[] = [];
    return {
      ImportDeclaration: node => {
        const moduleName = (node as ImportDeclaration).source.value;
        if (moduleName === 'react-intl') {
          importedMacroVars = context.getDeclaredVariables(node);
        }
      },
      JSXOpeningElement: (node: Node) =>
        checkNode(context, node, importedMacroVars),
      CallExpression: node => checkNode(context, node, importedMacroVars),
    };
  },
} as Rule.RuleModule;
