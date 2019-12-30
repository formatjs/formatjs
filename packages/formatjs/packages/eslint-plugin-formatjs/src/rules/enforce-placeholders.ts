import {Rule, Scope} from 'eslint';
import {ImportDeclaration, Node, Expression} from 'estree';
import {extractMessages} from '../util';
import {
  parse,
  isPluralElement,
  MessageFormatElement,
  isLiteralElement,
  isSelectElement,
  isPoundElement,
} from 'intl-messageformat-parser';

class PlaceholderEnforcement extends Error {
  public message: string;
  constructor(message: string) {
    super();
    this.message = message;
  }
}

function keyExistsInExpression(key: string, values: Expression | undefined) {
  if (!values) {
    return false;
  }
  if (values.type !== 'ObjectExpression') {
    return true; // True bc we cannot evaluate this
  }
  return !!values.properties.find(prop => {
    switch (prop.key.type) {
      case 'Identifier':
        return prop.key.name === key;
      case 'Literal':
        return prop.key.value === key;
    }
    return false;
  });
}

function verifyAst(
  ast: MessageFormatElement[],
  values: Expression | undefined
) {
  for (const el of ast) {
    if (isLiteralElement(el) || isPoundElement(el)) {
      continue;
    }
    if (!keyExistsInExpression(el.value, values)) {
      throw new PlaceholderEnforcement(
        `Missing value for placeholder "${el.value}"`
      );
    }

    if (isPluralElement(el) || isSelectElement(el)) {
      for (const selector of Object.keys(el.options)) {
        verifyAst(el.options[selector].value, values);
      }
    }
  }
}

function checkNode(
  context: Rule.RuleContext,
  node: Node,
  importedMacroVars: Scope.Variable[]
) {
  const msgs = extractMessages(node, importedMacroVars, true);

  for (const [
    {
      message: {defaultMessage},
      messageNode,
    },
    values,
  ] of msgs) {
    if (!defaultMessage || !messageNode) {
      continue;
    }
    try {
      verifyAst(parse(defaultMessage), values);
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
      description:
        'Enforce that all messages with placeholders have enough passed-in values',
      category: 'Errors',
      recommended: true,
      url:
        'https://github.com/formatjs/formatjs/tree/master/packages/eslint-plugin-formatjs#enforce-placeholders',
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
