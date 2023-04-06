import {Rule} from 'eslint'
import {TSESTree} from '@typescript-eslint/typescript-estree'
import {extractMessages, getSettings} from '../util'
import {
  parse,
  MessageFormatElement,
  TYPE,
} from '@formatjs/icu-messageformat-parser'

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

function checkNode(context: Rule.RuleContext, node: TSESTree.Node) {
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
        if (
          (prop.type === 'MethodDefinition' || prop.type === 'Property') &&
          !prop.computed &&
          prop.key.type !== 'PrivateIdentifier'
        ) {
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
        node: messageNode as any,
        message: e instanceof Error ? e.message : String(e),
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
        node: messageNode as any,
        message: `Missing value(s) for the following placeholder(s): ${missingPlaceholders.join(
          ', '
        )}.`,
      })
    }

    literalElementByLiteralKey.forEach((element, key) => {
      if (!ignoreList.has(key) && !placeholderNames.has(key)) {
        context.report({
          node: element as any,
          message: 'Value not used by the message.',
        })
      }
    })
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
      url: 'https://formatjs.io/docs/tooling/linter#enforce-placeholders',
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
