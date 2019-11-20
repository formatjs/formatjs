import {Rule, Scope} from 'eslint';
import {extractMessages} from '../util';
import {
  parse,
  isPluralElement,
  MessageFormatElement,
} from 'intl-messageformat-parser';
import {ImportDeclaration, Node} from 'estree';

class NoOffsetError extends Error {
  public message = 'offset are not allowed in plural rules';
}

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

  for (const [
    {
      message: {defaultMessage},
      messageNode,
    },
  ] of msgs) {
    if (!defaultMessage || !messageNode) {
      continue;
    }
    try {
      verifyAst(parse(defaultMessage));
    } catch (e) {
      context.report({
        node: messageNode,
        message: e.message,
      });
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
      url:
        'https://github.com/formatjs/formatjs/tree/master/packages/eslint-plugin-formatjs#no-offset',
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
