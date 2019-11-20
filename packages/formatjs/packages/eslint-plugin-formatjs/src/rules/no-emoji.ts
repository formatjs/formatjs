import {Rule, Scope} from 'eslint';
import {ImportDeclaration, Node} from 'estree';
import {extractMessages} from '../util';
import * as emojiRegex from 'emoji-regex';
const EMOJI_REGEX: RegExp = (emojiRegex as any)();

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
    if (EMOJI_REGEX.test(defaultMessage)) {
      context.report({
        node: messageNode,
        message: 'Emojis are not allowed',
      });
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
    fixable: 'code',
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
