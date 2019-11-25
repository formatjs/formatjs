import {Rule, Scope} from 'eslint';
import {extractMessages} from '../util';
import {
  parse,
  MessageFormatElement,
  isDateElement,
  isTimeElement,
  isDateTimeSkeleton,
  parseDateTimeSkeleton,
  isPluralElement,
  isSelectElement,
} from 'intl-messageformat-parser';
import {ImportDeclaration, Node} from 'estree';

function verifySkeleton(ast: MessageFormatElement[]) {
  for (const el of ast) {
    if (isPluralElement(el) || isSelectElement(el)) {
      const {options} = el;
      for (const selector of Object.keys(options)) {
        verifySkeleton(options[selector].value);
      }
    }
    if (
      (isDateElement(el) || isTimeElement(el)) &&
      isDateTimeSkeleton(el.style)
    ) {
      parseDateTimeSkeleton(el.style.pattern);
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
      verifySkeleton(parse(defaultMessage));
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
        'https://github.com/formatjs/formatjs/tree/master/packages/eslint-plugin-formatjs#supported-datetime-skeleton',
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
