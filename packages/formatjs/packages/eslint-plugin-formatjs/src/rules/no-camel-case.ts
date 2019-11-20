import {Rule, Scope} from 'eslint';
import {ImportDeclaration, Node} from 'estree';
import {
  parse,
  isPluralElement,
  MessageFormatElement,
  isArgumentElement,
} from 'intl-messageformat-parser';
import {extractMessages} from '../util';

const CAMEL_CASE_REGEX = /[A-Z]/;

class CamelCase extends Error {
  public message = 'Camel case arguments are not allowed';
}

function verifyAst(ast: MessageFormatElement[]) {
  for (const el of ast) {
    if (isArgumentElement(el)) {
      if (CAMEL_CASE_REGEX.test(el.value)) {
        throw new CamelCase();
      }
      continue;
    }
    if (isPluralElement(el)) {
      if (CAMEL_CASE_REGEX.test(el.value)) {
        throw new CamelCase();
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
      description: 'Disallow camel case placeholders in message',
      category: 'Errors',
      recommended: false,
      url:
        'https://github.com/formatjs/formatjs/tree/master/packages/eslint-plugin-formatjs#no-camel-case',
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
