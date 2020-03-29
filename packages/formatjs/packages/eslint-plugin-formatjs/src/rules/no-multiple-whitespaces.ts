import {Rule, Scope} from 'eslint';
import {ImportDeclaration, Node} from 'estree';
import {extractMessages} from '../util';
const MULTIPLE_SPACES = /\s{2,}/g;

function checkNode(
  context: Rule.RuleContext,
  node: Node,
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
    let reportObject: Parameters<typeof context['report']>[0] | undefined;
    if (MULTIPLE_SPACES.test(defaultMessage)) {
      reportObject = {
        node: messageNode,
        message: 'Multiple consecutive whitespaces are not allowed',
      };
      if (messageNode.type === 'Literal' && messageNode.raw) {
        reportObject.fix = function(fixer) {
          return fixer.replaceText(
            messageNode,
            messageNode.raw!.replace(MULTIPLE_SPACES, ' ')
          );
        };
      }
      if (reportObject) {
        context.report(reportObject);
      }
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
      url:
        'https://github.com/formatjs/formatjs/tree/master/packages/eslint-plugin-formatjs#no-emoji',
    },
    fixable: 'whitespace',
  },
  create(context) {
    let importedMacroVars: Scope.Variable[] = [];
    return {
      ImportDeclaration: node => {
        const moduleName = (node as ImportDeclaration).source.value;
        if (moduleName === '@formatjs/macro' || moduleName === 'react-intl') {
          importedMacroVars = context.getDeclaredVariables(node);
        }
      },
      JSXOpeningElement: (node: Node) =>
        checkNode(context, node, importedMacroVars),
      CallExpression: node => checkNode(context, node, importedMacroVars),
    };
  },
};

export default rule;
