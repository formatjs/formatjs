import {Rule} from 'eslint'
import {TSESTree} from '@typescript-eslint/typescript-estree'
import {extractMessages, getSettings} from '../util'
import {
  parse,
  isPluralElement,
  MessageFormatElement,
  isLiteralElement,
  isSelectElement,
  isPoundElement,
  isTagElement,
} from '@formatjs/icu-messageformat-parser'

class PlaceholderEnforcement extends Error {
  public message: string
  constructor(message: string) {
    super()
    this.message = message
  }
}

function keyExistsInExpression(
  key: string,
  values: TSESTree.Expression | undefined
) {
  if (!values) {
    return false
  }
  if (values.type !== 'ObjectExpression') {
    return true // True bc we cannot evaluate this
  }
  if (values.properties.find(prop => prop.type === 'SpreadElement')) {
    return true // True bc there's a spread element
  }
  return !!values.properties.find(prop => {
    if (prop.type !== 'Property') {
      return false
    }
    switch (prop.key.type) {
      case 'Identifier':
        return prop.key.name === key
      case 'Literal':
        return prop.key.value === key
    }
    return false
  })
}

function verifyAst(
  ast: MessageFormatElement[],
  values: TSESTree.Expression | undefined,
  ignoreList: Set<string>
) {
  for (const el of ast) {
    if (isLiteralElement(el) || isPoundElement(el)) {
      continue
    }
    const key = el.value
    if (!ignoreList.has(key) && !keyExistsInExpression(key, values)) {
      throw new PlaceholderEnforcement(
        `Missing value for placeholder "${el.value}"`
      )
    }

    if (isPluralElement(el) || isSelectElement(el)) {
      for (const selector of Object.keys(el.options)) {
        verifyAst(el.options[selector].value, values, ignoreList)
      }
    }

    if (isTagElement(el)) {
      verifyAst(el.children, values, ignoreList)
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
    try {
      verifyAst(
        parse(defaultMessage, {
          ignoreTag: settings.ignoreTag,
        }),
        values,
        ignoreList
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
      description:
        'Enforce that all messages with placeholders have enough passed-in values',
      category: 'Errors',
      recommended: true,
      url: 'https://formatjs.io/docs/tooling/linter#enforce-placeholders',
    },
    fixable: 'code',
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
