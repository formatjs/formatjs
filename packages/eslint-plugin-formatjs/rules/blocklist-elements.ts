import {
  type MessageFormatElement,
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
import type {Node} from 'estree-jsx'
import type {Rule} from 'eslint'
import {
  extractMessages,
  getSettings,
} from '#packages/eslint-plugin-formatjs/util.js'
import {
  type CoreMessageIds,
  CORE_MESSAGES,
} from '#packages/eslint-plugin-formatjs/messages.js'

type MessageIds = 'blocklist' | CoreMessageIds

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

interface BlocklistException {
  variable: string
  options?: string[]
}

type BlocklistedElement =
  | Element
  | {
      type: Element
      allow: BlocklistException
    }

function isBlocklisted(
  blocklist: BlocklistedElement[],
  type: Element,
  element: MessageFormatElement
): boolean {
  return blocklist.some(entry => {
    if (typeof entry === 'string') {
      return entry === type
    }
    if (entry.type !== type) {
      return false
    }
    if (!('value' in element) || element.value !== entry.allow.variable) {
      return true
    }
    const allowedOptions = entry.allow.options
    if (!allowedOptions) {
      return false
    }
    if (!isSelectElement(element) && !isPluralElement(element)) {
      return true
    }
    const options = Object.keys(element.options)
    return (
      options.length !== allowedOptions.length ||
      options.some(option => !allowedOptions.includes(option))
    )
  })
}

function verifyAst(
  blocklist: BlocklistedElement[],
  ast: MessageFormatElement[]
) {
  const errors: ReturnType<typeof getMessage>[] = []
  for (const el of ast) {
    if (isLiteralElement(el) && isBlocklisted(blocklist, Element.literal, el)) {
      errors.push(getMessage(Element.literal))
    }
    if (
      isArgumentElement(el) &&
      isBlocklisted(blocklist, Element.argument, el)
    ) {
      errors.push(getMessage(Element.argument))
    }
    if (isNumberElement(el) && isBlocklisted(blocklist, Element.number, el)) {
      errors.push(getMessage(Element.number))
    }
    if (isDateElement(el) && isBlocklisted(blocklist, Element.date, el)) {
      errors.push(getMessage(Element.date))
    }
    if (isTimeElement(el) && isBlocklisted(blocklist, Element.time, el)) {
      errors.push(getMessage(Element.time))
    }
    if (isSelectElement(el) && isBlocklisted(blocklist, Element.select, el)) {
      errors.push(getMessage(Element.select))
    }
    if (isTagElement(el) && isBlocklisted(blocklist, Element.tag, el)) {
      errors.push(getMessage(Element.tag))
    }
    if (isTagElement(el)) {
      errors.push(...verifyAst(blocklist, el.children))
    }
    if (isPluralElement(el)) {
      if (isBlocklisted(blocklist, Element.plural, el)) {
        errors.push(getMessage(Element.argument))
      }
      if (
        el.pluralType === 'ordinal' &&
        isBlocklisted(blocklist, Element.selectordinal, el)
      ) {
        errors.push(getMessage(Element.selectordinal))
      }
    }
    if (isSelectElement(el) || isPluralElement(el)) {
      const {options} = el
      for (const selector of Object.keys(options)) {
        errors.push(...verifyAst(blocklist, options[selector].value))
      }
    }
  }

  return errors
}

function checkNode(context: Rule.RuleContext, node: Node) {
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
    let ast: MessageFormatElement[]
    try {
      ast = parse(defaultMessage, {
        ignoreTag: settings.ignoreTag,
      })
    } catch (e) {
      context.report({
        node: messageNode,
        messageId: 'parseError',
        data: {
          error: (e as Error).message,
        },
      })
      continue
    }
    const errors = verifyAst(blocklist, ast)
    for (const error of errors) {
      context.report({
        node: messageNode,
        ...error,
      })
    }
  }
}

export const rule: Rule.RuleModule = {
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
          oneOf: [
            {
              type: 'string',
              enum: Object.keys(Element),
            },
            {
              type: 'object',
              additionalProperties: false,
              required: ['type', 'allow'],
              properties: {
                type: {
                  type: 'string',
                  enum: Object.keys(Element),
                },
                allow: {
                  type: 'object',
                  additionalProperties: false,
                  required: ['variable'],
                  properties: {
                    variable: {type: 'string'},
                    options: {
                      type: 'array',
                      uniqueItems: true,
                      items: {type: 'string'},
                    },
                  },
                },
              },
            },
          ],
        },
      },
    ],
    messages: {
      ...CORE_MESSAGES,
      blocklist: `{{type}} element is blocklisted`,
    },
  },
  create(context) {
    const callExpressionVisitor: Rule.RuleListener['CallExpression'] = node =>
      checkNode(context, node)

    const parserServices = context.sourceCode.parserServices
    if (parserServices?.defineTemplateBodyVisitor) {
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
}
