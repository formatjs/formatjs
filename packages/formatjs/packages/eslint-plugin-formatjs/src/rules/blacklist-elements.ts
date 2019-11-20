import {Rule, Scope} from 'eslint';
import {ImportDeclaration, Node} from 'estree';
import {extractMessages} from '../util';
import {
  parse,
  isPluralElement,
  MessageFormatElement,
  isLiteralElement,
  isArgumentElement,
  isNumberElement,
  isDateElement,
  isTimeElement,
  isSelectElement,
} from 'intl-messageformat-parser';

class BlacklistElement extends Error {
  public message: string;
  constructor(type: Element) {
    super();
    this.message = `${type} element is blacklisted`;
  }
}

enum Element {
  literal = 'literal',
  argument = 'argument',
  number = 'number',
  date = 'date',
  time = 'time',
  select = 'select',
  selectordinal = 'selectordinal',
  plural = 'plural',
}

function verifyAst(blacklist: Element[], ast: MessageFormatElement[]) {
  for (const el of ast) {
    if (isLiteralElement(el) && blacklist.includes(Element.literal)) {
      throw new BlacklistElement(Element.literal);
    }
    if (isArgumentElement(el) && blacklist.includes(Element.argument)) {
      throw new BlacklistElement(Element.argument);
    }
    if (isNumberElement(el) && blacklist.includes(Element.number)) {
      throw new BlacklistElement(Element.number);
    }
    if (isDateElement(el) && blacklist.includes(Element.date)) {
      throw new BlacklistElement(Element.date);
    }
    if (isTimeElement(el) && blacklist.includes(Element.time)) {
      throw new BlacklistElement(Element.time);
    }
    if (isSelectElement(el) && blacklist.includes(Element.select)) {
      throw new BlacklistElement(Element.select);
    }
    if (isPluralElement(el)) {
      if (blacklist.includes(Element.plural)) {
        throw new BlacklistElement(Element.argument);
      }
      if (
        el.pluralType === 'ordinal' &&
        blacklist.includes(Element.selectordinal)
      ) {
        throw new BlacklistElement(Element.selectordinal);
      }
    }
    if (isSelectElement(el) || isPluralElement(el)) {
      const {options} = el;
      for (const selector of Object.keys(options)) {
        verifyAst(blacklist, options[selector].value);
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

  const blacklist = context.options[0];
  if (!Array.isArray(blacklist) || !blacklist.length) {
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
      description: 'Disallow specific elements in ICU message format',
      category: 'Errors',
      recommended: false,
      url:
        'https://github.com/formatjs/formatjs/tree/master/packages/eslint-plugin-formatjs#blacklist-elements',
    },
    fixable: 'code',
    schema: [
      {
        type: 'array',
        properties: {
          items: {
            type: 'string',
            enum: Object.keys(Element),
          },
        },
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
