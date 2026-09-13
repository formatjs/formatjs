import {
  type MessageFormatElement,
  parse,
} from '@formatjs/icu-messageformat-parser'
import {collectMessageArguments} from '#packages/eslint-plugin-formatjs/message-types.js'
import type {Literal, Node, Property, SpreadElement} from 'estree-jsx'
import type {Rule} from 'eslint'
import {
  extractMessages,
  getSettings,
} from '#packages/eslint-plugin-formatjs/util.js'

export function messageIgnoreTag(
  context: Rule.RuleContext,
  node: Node
): boolean | undefined {
  let ignoreTag = getSettings(context).ignoreTag ?? false
  if (node.type !== 'CallExpression' || !node.arguments[2]) return ignoreTag
  const options = node.arguments[2]
  if (options.type !== 'ObjectExpression') return
  for (const property of options.properties) {
    if (
      property.type !== 'Property' ||
      property.computed ||
      property.method ||
      property.kind !== 'init'
    )
      return
    const key =
      property.key.type === 'Identifier'
        ? property.key.name
        : property.key.type === 'Literal'
          ? property.key.value
          : undefined
    if (key !== 'ignoreTag') continue
    if (
      property.value.type !== 'Literal' ||
      typeof property.value.value !== 'boolean'
    )
      return
    ignoreTag = property.value.value
  }
  return ignoreTag
}

export function checkPlaceholders(context: Rule.RuleContext, node: Node): void {
  const settings = getSettings(context)
  const ignoreTag = messageIgnoreTag(context, node)
  if (ignoreTag === undefined) return
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
      Property | SpreadElement
    >()

    if (values) {
      for (const prop of values.properties) {
        if (prop.type === 'Property' && !prop.computed) {
          const name =
            prop.key.type === 'Identifier'
              ? prop.key.name
              : String((prop.key as Literal).value)
          literalElementByLiteralKey.set(name, prop)
        }
      }
    }

    let ast: MessageFormatElement[]

    try {
      ast = parse(defaultMessage, {ignoreTag})
    } catch (e) {
      context.report({
        node: messageNode,
        messageId: 'parseError',
        data: {error: e instanceof Error ? e.message : String(e)},
      })
      continue
    }

    const placeholderNames = new Set(collectMessageArguments(ast).keys())

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
