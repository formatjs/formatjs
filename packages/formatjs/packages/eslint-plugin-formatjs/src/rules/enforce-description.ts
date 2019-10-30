import {Rule, Scope} from 'eslint';
import {ImportDeclaration} from 'estree';
import {extractMessages} from '../util';

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce description in message descriptor',
      category: 'Errors',
      recommended: false,
    },
    fixable: 'code',
    messages: {
      description: '`description` has to be specified in message descriptor',
    },
  },
  create(context) {
    let importedMacroVars: Scope.Variable[] = [];
    return {
      ImportDeclaration: node => {
        if ((node as ImportDeclaration).source.value === '@formatjs/macro') {
          importedMacroVars = context.getDeclaredVariables(node);
        }
      },
      CallExpression: node => {
        const msgs = extractMessages(node, importedMacroVars);
        if (!msgs.length) {
          return;
        }
        for (const msg of msgs) {
          if (!msg.description) {
            context.report({
              node,
              messageId: 'description',
            });
          }
        }
      },
    };
  },
};

export default rule;
