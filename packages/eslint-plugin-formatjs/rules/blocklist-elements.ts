import {
  MessageFormatElement,
  isArgumentElement,
  isDateElement,
  isLiteralElement,
  isNumberElement,
  isPluralElement,
  isSelectElement,
  isTagElement,
  isTimeElement,
  parse,
} from '@formatjs/icu-messageformat-parser'
import {ESLintUtils, TSESTree} from '@typescript-eslint/utils'
import {RuleContext} from '@typescript-eslint/utils/ts-eslint'
import {getParserServices} from '../context-compat'
import {extractMessages, getSettings} from '../util'

type MessageIds = 'blocklist'

export const name = 'blocklist-elements'

function getMessage(type: Element): {
  messageId: MessageIds
  data: Record<string, Element>
} {
  return {
    messageId: 'blocklist',
    data: {type},
  }
}

export enum Element {
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
  const errors: ReturnType<typeof getMessage>[] = []
  for (const el of ast) {
    if (isLiteralElement(el) && blocklist.includes(Element.literal)) {
      errors.push(getMessage(Element.literal))
    }
    if (isArgumentElement(el) && blocklist.includes(Element.argument)) {
      errors.push(getMessage(Element.argument))
    }
    if (isNumberElement(el) && blocklist.includes(Element.number)) {
      errors.push(getMessage(Element.number))
    }
    if (isDateElement(el) && blocklist.includes(Element.date)) {
      errors.push(getMessage(Element.date))
    }
    if (isTimeElement(el) && blocklist.includes(Element.time)) {
      errors.push(getMessage(Element.time))
    }
    if (isSelectElement(el) && blocklist.includes(Element.select)) {
      errors.push(getMessage(Element.select))
    }
    if (isTagElement(el) && blocklist.includes(Element.tag)) {
      errors.push(getMessage(Element.tag))
    }
    if (isPluralElement(el)) {
      if (blocklist.includes(Element.plural)) {
        errors.push(getMessage(Element.argument))
      }
      if (
        el.pluralType === 'ordinal' &&
        blocklist.includes(Element.selectordinal)
      ) {
        errors.push(getMessage(Element.selectordinal))
      }
    }
    if (isSelectElement(el) || isPluralElement(el)) {
      const {options} = el
      for (const selector of Object.keys(options)) {
        verifyAst(blocklist, options[selector].value)
      }
    }
  }

  return errors
}

function checkNode(
  context: RuleContext<MessageIds, unknown[]>,
  node: TSESTree.Node
) {
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
    const errors = verifyAst(
      blocklist,
      parse(defaultMessage, {
        ignoreTag: settings.ignoreTag,
      })
    )
    for (const error of errors) {
      context.report({
        node,
        ...error,
      })
    }
  }
}

const createRule = ESLintUtils.RuleCreator(
  _ => 'https://formatjs.github.io/docs/tooling/linter#blocklist-elements'
)

export const rule = createRule({
  name,
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow specific elements in ICU message format',
      url: 'https://formatjs.github.io/docs/tooling/linter#blocklist-elements',
    },
    fixable: 'code',
    schema: [
      {
        type: 'array',
        items: {
          type: 'string',
          enum: Object.keys(Element),
        },
      },
    ],
    messages: {
      blocklist: `{{type}} element is blocklisted`,
    },
  },
  defaultOptions: [],
  create(context) {
    const callExpressionVisitor: ESLintUtils.RuleListener['CallExpression'] =
      node => checkNode(context, node)

    const parserServices = getParserServices(context)
    //@ts-expect-error defineTemplateBodyVisitor exists in Vue parser
    if (parserServices?.defineTemplateBodyVisitor) {
      //@ts-expect-error
      return parserServices.defineTemplateBodyVisitor(
        {
          CallExpression: callExpressionVisitor,
        },
        {
          CallExpression: callExpressionVisitor,
        }
      )
    }
    return {
      JSXOpeningElement: node => checkNode(context, node),
      CallExpression: callExpressionVisitor,
    }
  },
})
