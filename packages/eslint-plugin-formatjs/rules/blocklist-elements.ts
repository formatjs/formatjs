import {Rule} from 'eslint'
import {extractMessages, getSettings} from '../util'
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
  isTagElement,
} from '@formatjs/icu-messageformat-parser'
import {TSESTree} from '@typescript-eslint/typescript-estree'

class BlacklistElement extends Error {
  public message: string
  constructor(type: Element) {
    super()
    this.message = `${type} element is blocklisted`
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
  tag = 'tag',
}

function verifyAst(blocklist: Element[], ast: MessageFormatElement[]) {
  for (const el of ast) {
    if (isLiteralElement(el) && blocklist.includes(Element.literal)) {
      throw new BlacklistElement(Element.literal)
    }
    if (isArgumentElement(el) && blocklist.includes(Element.argument)) {
      throw new BlacklistElement(Element.argument)
    }
    if (isNumberElement(el) && blocklist.includes(Element.number)) {
      throw new BlacklistElement(Element.number)
    }
    if (isDateElement(el) && blocklist.includes(Element.date)) {
      throw new BlacklistElement(Element.date)
    }
    if (isTimeElement(el) && blocklist.includes(Element.time)) {
      throw new BlacklistElement(Element.time)
    }
    if (isSelectElement(el) && blocklist.includes(Element.select)) {
      throw new BlacklistElement(Element.select)
    }
    if (isTagElement(el) && blocklist.includes(Element.tag)) {
      throw new BlacklistElement(Element.tag)
    }
    if (isPluralElement(el)) {
      if (blocklist.includes(Element.plural)) {
        throw new BlacklistElement(Element.argument)
      }
      if (
        el.pluralType === 'ordinal' &&
        blocklist.includes(Element.selectordinal)
      ) {
        throw new BlacklistElement(Element.selectordinal)
      }
    }
    if (isSelectElement(el) || isPluralElement(el)) {
      const {options} = el
      for (const selector of Object.keys(options)) {
        verifyAst(blocklist, options[selector].value)
      }
    }
  }
}

function checkNode(context: Rule.RuleContext, node: TSESTree.Node) {
  const settings = getSettings(context)
  const msgs = extractMessages(node, settings)
  if (!msgs.length) {
    return
  }

  const blocklist = context.options[0]
  if (!Array.isArray(blocklist) || !blocklist.length) {
    return
  }
  for (const [
    {
      message: {defaultMessage},
      messageNode,
    },
  ] of msgs) {
    if (!defaultMessage || !messageNode) {
      continue
    }
    try {
      verifyAst(
        context.options[0],
        parse(defaultMessage, {
          ignoreTag: settings.ignoreTag,
        })
      )
    } catch (e) {
      context.report({
        node: messageNode as any,
        message: e instanceof Error ? e.message : String(e),
      })
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
      url: 'https://formatjs.io/docs/tooling/linter#blocklist-elements',
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
    const callExpressionVisitor = (node: TSESTree.Node) =>
      checkNode(context, node)

    if (context.parserServices.defineTemplateBodyVisitor) {
      return context.parserServices.defineTemplateBodyVisitor(
        {
          CallExpression: callExpressionVisitor,
        },
        {
          CallExpression: callExpressionVisitor,
        }
      )
    }
    return {
      JSXOpeningElement: (node: TSESTree.Node) => checkNode(context, node),
      CallExpression: callExpressionVisitor,
    }
  },
}

export default rule
