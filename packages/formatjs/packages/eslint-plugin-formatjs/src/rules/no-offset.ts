import {Rule, Scope} from 'eslint';
import {extractImportVars, extractMessages} from '../util';
import {
  parse,
  isPluralElement,
  MessageFormatElement,
} from 'intl-messageformat-parser';

class NoOffsetError extends Error {}

function verifyAst(ast: MessageFormatElement[]) {
  for (const el of ast) {
    if (isPluralElement(el)) {
      if (el.offset) {
        throw new NoOffsetError();
      }
      const {options} = el;
      for (const selector of Object.keys(options)) {
        verifyAst(options[selector].value);
      }
    }
  }
}

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow offset in plural rules',
      category: 'Errors',
      recommended: false,
    },
    fixable: 'code',
    messages: {
      noOffset: 'offset are not allowed in plural rules',
    },
  },
  create(context) {
    let importedMacroVars: Scope.Variable[] = [];
    return {
      ImportDeclaration: node => {
        importedMacroVars = extractImportVars(context, node);
      },
      CallExpression: node => {
        const msgs = extractMessages(node, importedMacroVars);
        if (!msgs.length) {
          return;
        }
        msgs.forEach(msg => {
          if (!msg.defaultMessage) {
            return;
          }
          const ast = parse(msg.defaultMessage);
          try {
            verifyAst(ast);
          } catch (e) {
            if (e instanceof NoOffsetError) {
              context.report({
                node,
                messageId: 'noOffset',
              });
            }
          }
        });
      },
    };
  },
};

export default rule;
