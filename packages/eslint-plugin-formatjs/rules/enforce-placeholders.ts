import {
  MessageFormatElement,
  TYPE,
  parse,
} from '@formatjs/icu-messageformat-parser'
import {TSESTree} from '@typescript-eslint/utils'
import {RuleContext, RuleModule} from '@typescript-eslint/utils/ts-eslint'
import {getParserServices} from '../context-compat'
import {extractMessages, getSettings} from '../util'

type MessageIds = 'parserError' | 'missingValue' | 'unusedValue'
type Options = [{ignoreList: string[]}?]

function collectPlaceholderNames(ast: MessageFormatElement[]): Set<string> {
  const placeholderNames = new Set<string>()
  _traverse(ast)
  return placeholderNames

  function _traverse(ast: MessageFormatElement[]) {
    for (const element of ast) {
      switch (element.type) {
        case TYPE.literal:
        case TYPE.pound:
          break
        case TYPE.tag:
          placeholderNames.add(element.value)
          _traverse(element.children)
          break
        case TYPE.plural:
        case TYPE.select:
          placeholderNames.add(element.value)
          for (const {value} of Object.values(element.options)) {
            _traverse(value)
          }
          break
        default:
          placeholderNames.add(element.value)
          break
      }
    }
  }
}

function checkNode(
  context: RuleContext<MessageIds, Options>,
  node: TSESTree.Node
) {
  const settings = getSettings(context)
  const msgs = extractMessages(node, {
    excludeMessageDeclCalls: true,
    ...settings,
  })
  const {
    options: [opt],
  } = context
  const ignoreList = new Set<string>(opt?.ignoreList || [])
  for (const [
    {
      message: {defaultMessage},
      messageNode,
    },
    values,
  ] of msgs) {
    if (!defaultMessage || !messageNode) {
      continue
    }

    if (values && values.type !== 'ObjectExpression') {
      // cannot evaluate this
      continue
    }

    if (values?.properties.find(prop => prop.type === 'SpreadElement')) {
      // cannot evaluate the spread element
      continue
    }

    const literalElementByLiteralKey = new Map<
      string,
      TSESTree.ObjectLiteralElement
    >()

    if (values) {
      for (const prop of values.properties) {
        if (prop.type === 'Property' && !prop.computed) {
          const name =
            prop.key.type === 'Identifier'
              ? prop.key.name
              : String(prop.key.value)
          literalElementByLiteralKey.set(name, prop)
        }
      }
    }

    let ast: MessageFormatElement[]

    try {
      ast = parse(defaultMessage, {ignoreTag: settings.ignoreTag})
    } catch (e) {
      context.report({
        node: messageNode,
        messageId: 'parserError',
        data: {message: e instanceof Error ? e.message : String(e)},
      })
      continue
    }

    const placeholderNames = collectPlaceholderNames(ast)

    const missingPlaceholders: string[] = []
    placeholderNames.forEach(name => {
      if (!ignoreList.has(name) && !literalElementByLiteralKey.has(name)) {
        missingPlaceholders.push(name)
      }
    })

    if (missingPlaceholders.length > 0) {
      context.report({
        node: messageNode,
        messageId: 'missingValue',
        data: {
          list: missingPlaceholders.join(', '),
        },
      })
    }

    literalElementByLiteralKey.forEach((element, key) => {
      if (!ignoreList.has(key) && !placeholderNames.has(key)) {
        context.report({
          node: element,
          messageId: 'unusedValue',
        })
      }
    })
  }
}

export const name = 'enforce-placeholders'

export const rule: RuleModule<MessageIds, Options> = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Enforce that all messages with placeholders have enough passed-in values',
      url: 'https://formatjs.github.io/docs/tooling/linter#enforce-placeholders',
    },
    schema: [
      {
        type: 'object',
        properties: {
          ignoreList: {
            type: 'array',
            items: {
              type: 'string',
            },
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      parserError: '{{message}}',
      missingValue:
        'Missing value(s) for the following placeholder(s): {{list}}.',
      unusedValue: 'Value not used by the message.',
    },
  },
  defaultOptions: [],
  create(context) {
    const callExpressionVisitor = (node: TSESTree.Node) =>
      checkNode(context, node)

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
      JSXOpeningElement: (node: TSESTree.Node) => checkNode(context, node),
      CallExpression: callExpressionVisitor,
    }
  },
}
