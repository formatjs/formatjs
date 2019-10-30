import {Rule, Scope} from 'eslint';
import {extractMessages} from '../util';
import {
  parse,
  isPluralElement,
  MessageFormatElement,
} from 'intl-messageformat-parser';
import {ImportDeclaration, Node} from 'estree';

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

function checkNode(
  context: Rule.RuleContext,
  node: Node,
  importedMacroVars: Scope.Variable[]
) {
  const msgs = extractMessages(node, importedMacroVars);
  if (!msgs.length) {
    return;
  }
  for (const msg of msgs) {
    if (!msg.defaultMessage) {
      continue;
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
