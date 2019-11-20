import {Rule, Scope} from 'eslint';
import {ImportDeclaration, Node} from 'estree';
import {extractMessages} from '../util';
import {
  parse,
  isPluralElement,
  MessageFormatElement,
} from 'intl-messageformat-parser';
import {JSONSchema4} from 'json-schema';

class PluralRulesEnforcement extends Error {
  public message: string;
  constructor(message: string) {
    super();
    this.message = message;
  }
}

enum LDML {
  zero = 'zero',
  one = 'one',
  two = 'two',
  few = 'few',
  many = 'many',
  other = 'other',
}

function verifyAst(
  plConfig: Record<keyof LDML, boolean>,
  ast: MessageFormatElement[]
) {
  for (const el of ast) {
    if (isPluralElement(el)) {
      const rules = Object.keys(plConfig) as Array<keyof LDML>;
      for (const rule of rules) {
        if (plConfig[rule] && !el.options[rule]) {
          throw new PluralRulesEnforcement(`Missing plural rule "${rule}"`);
        }
        if (!plConfig[rule] && el.options[rule]) {
          throw new PluralRulesEnforcement(
            `Plural rule "${rule}" is forbidden`
          );
        }
      }
      const {options} = el;
      for (const selector of Object.keys(options)) {
        verifyAst(plConfig, options[selector].value);
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

  const plConfig: Record<keyof LDML, boolean> = context.options[0];
  if (!plConfig) {
    return;
  }
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
      verifyAst(context.options[0], parse(defaultMessage));
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
        'Enforce plural rules to always specify certain categories like `one`/`other`',
      category: 'Errors',
      recommended: false,
      url:
        'https://github.com/formatjs/formatjs/tree/master/packages/eslint-plugin-formatjs#enforce-plural-rules',
    },
    fixable: 'code',
    schema: [
      {
        type: 'object',
        properties: Object.keys(LDML).reduce((schema: JSONSchema4, k) => {
          schema[k] = {
            type: 'boolean',
          };
          return schema;
        }, {}),
        additionalProperties: false,
      },
    ],
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
