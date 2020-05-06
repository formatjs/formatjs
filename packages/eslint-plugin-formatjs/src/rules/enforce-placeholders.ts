import {Rule, Scope} from 'eslint';
import {TSESTree} from '@typescript-eslint/typescript-estree';
import {extractMessages} from '../util';
import {
  parse,
  isPluralElement,
  MessageFormatElement,
  isLiteralElement,
  isSelectElement,
  isPoundElement,
} from 'intl-messageformat-parser';
import {ImportDeclaration, Node} from 'estree';

class PlaceholderEnforcement extends Error {
  public message: string;
  constructor(message: string) {
    super();
    this.message = message;
  }
}

function keyExistsInExpression(
  key: string,
  values: TSESTree.Expression | undefined
) {
  if (!values) {
    return false;
  }
  if (values.type !== 'ObjectExpression') {
    return true; // True bc we cannot evaluate this
  }
  if (values.properties.find(prop => prop.type === 'SpreadElement')) {
    return true; // True bc there's a spread element
  }
  return !!values.properties.find(prop => {
    if (prop.type !== 'Property') {
      return false;
    }
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
  values: TSESTree.Expression | undefined
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
  node: TSESTree.Node,
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
        node: messageNode as Node,
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
        'https://formatjs.io/docs/tooling/linter#enforce-placeholders',
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
        checkNode(context, node as TSESTree.Node, importedMacroVars),
      CallExpression: node =>
        checkNode(context, node as TSESTree.Node, importedMacroVars),
    };
  },
};

export default rule;
