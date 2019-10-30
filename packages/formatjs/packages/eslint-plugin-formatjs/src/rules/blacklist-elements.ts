import {Rule, Scope} from 'eslint';
import {ImportDeclaration} from 'estree';
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
  public type: Element;
  constructor(type: Element) {
    super();
    this.type = type;
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
      if (blacklist.includes(Element.selectordinal)) {
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

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow specific element in ICU message format',
      category: 'Errors',
      recommended: false,
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
        if ((node as ImportDeclaration).source.value === '@formatjs/macro') {
          importedMacroVars = context.getDeclaredVariables(node);
        }
      },
      CallExpression: node => {
        const msgs = extractMessages(node, importedMacroVars);
        if (!msgs.length) {
          return;
        }

        const blacklist = context.options[0];
        if (!Array.isArray(blacklist) || !blacklist.length) {
          return;
        }
        msgs.forEach(msg => {
          if (!msg.defaultMessage) {
            return;
          }
          const ast = parse(msg.defaultMessage);
          try {
            verifyAst(context.options[0], ast);
          } catch (e) {
            if (e instanceof BlacklistElement) {
              context.report({
                node,
                message: `${e.type} element is blacklisted`,
              });
            }
          }
        });
      },
    };
  },
};

export default rule;
