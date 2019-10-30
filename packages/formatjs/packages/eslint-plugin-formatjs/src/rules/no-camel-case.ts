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

class CamelCase extends Error {}

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
      if (e instanceof CamelCase) {
        context.report({
          node,
          message: 'Camel case arguments are not allowed',
        });
      }
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
