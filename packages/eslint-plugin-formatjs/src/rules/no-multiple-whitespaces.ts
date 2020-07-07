import {Rule, Scope} from 'eslint';
import {ImportDeclaration, Node} from 'estree';
import {extractMessages} from '../util';
import {TSESTree} from '@typescript-eslint/typescript-estree';
const MULTIPLE_SPACES = /\s{2,}/g;

function checkNode(
  context: Rule.RuleContext,
  node: TSESTree.Node,
  importedMacroVars: Scope.Variable[]
) {
  const msgs = extractMessages(node, importedMacroVars);

  for (const [
    {
      message: {defaultMessage},
      messageNode,
    },
  ] of msgs) {
    if (!defaultMessage || !messageNode) {
      continue;
    }
    if (MULTIPLE_SPACES.test(defaultMessage)) {
      const reportObject: Parameters<typeof context['report']>[0] = {
        node: messageNode as Node,
        message: 'Multiple consecutive whitespaces are not allowed',
      };
      if (messageNode.type === 'Literal' && messageNode.raw) {
        reportObject.fix = function (fixer) {
          return fixer.replaceText(
            messageNode as Node,
            messageNode.raw!.replace(MULTIPLE_SPACES, ' ')
          );
        };
      }
      context.report(reportObject);
    }
  }
}

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow emojis in message',
      category: 'Errors',
      recommended: false,
      url: 'https://formatjs.io/docs/tooling/linter#no-emoji',
    },
    fixable: 'whitespace',
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
        checkNode(context, node as TSESTree.Node, importedMacroVars),
      CallExpression: node =>
        checkNode(context, node as TSESTree.Node, importedMacroVars),
    };
  },
};

export default rule;
