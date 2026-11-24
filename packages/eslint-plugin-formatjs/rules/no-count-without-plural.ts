import {
  type MessageFormatElement,
  parse,
  TYPE,
} from '@formatjs/icu-messageformat-parser'
import type {Rule} from 'eslint'
import type {Node} from 'estree-jsx'
import {
  CORE_MESSAGES,
  type CoreMessageIds,
} from '#packages/eslint-plugin-formatjs/messages.js'
import {
  extractMessages,
  getSettings,
} from '#packages/eslint-plugin-formatjs/util.js'

type MessageIds = 'countWithoutPlural' | CoreMessageIds

interface Options {
  countPattern?: string
}

// Kept narrow on purpose: `{amount}` is usually money and `{number}` usually
// an identifier such as an issue number.
const DEFAULT_COUNT_PATTERN =
  '^(?:count|n|num|total|quantity|qty|\\w+Count|\\w+Total)$'
// An English plural noun right after the count, like "{count} files" or
// "{count, number} PDFs". A lowercase letter before the final "s" skips
// acronyms and units such as "MBs" vs "MB".
const PLURAL_NOUN = /^\s+(\p{L}*\p{Ll}s)\b/u
const NOT_NOUNS = new Set([
  'as',
  'has',
  'his',
  'is',
  'its',
  'plus',
  'this',
  'us',
  'was',
  'yes',
])

function literalAt(ast: MessageFormatElement[], index: number): string {
  const element = ast[index]
  return element?.type === TYPE.literal ? element.value : ''
}

function isCountedNoun(ast: MessageFormatElement[], index: number): boolean {
  const next = literalAt(ast, index + 1)
  const noun = PLURAL_NOUN.exec(next)?.[1]
  if (noun !== undefined) {
    return !NOT_NOUNS.has(noun.toLowerCase())
  }
  // "{count, number} {label}": the noun is a separate fragment, which can't
  // agree with the count in any locale.
  return next === ' ' && ast[index + 2]?.type === TYPE.argument
}

// Counts inside a plural branch are skipped: the branch already chose the
// grammar, and a second count there is usually the display form of the
// selector, like `{quantity} units`.
function findCount(
  ast: MessageFormatElement[],
  countPattern: RegExp
): string | undefined {
  for (const [index, element] of ast.entries()) {
    if (
      (element.type === TYPE.argument || element.type === TYPE.number) &&
      countPattern.test(element.value) &&
      isCountedNoun(ast, index)
    ) {
      return element.value
    }
    if (element.type === TYPE.select) {
      for (const option of Object.values(element.options)) {
        const found = findCount(option.value, countPattern)
        if (found !== undefined) return found
      }
    }
    if (element.type === TYPE.tag) {
      const found = findCount(element.children, countPattern)
      if (found !== undefined) return found
    }
  }
  return undefined
}

function checkNode(
  context: Rule.RuleContext,
  node: Node,
  countPattern: RegExp
) {
  const settings = getSettings(context)
  for (const [{message, messageNode}] of extractMessages(node, settings)) {
    if (!message.defaultMessage || !messageNode) {
      continue
    }
    let ast: MessageFormatElement[]
    try {
      ast = parse(message.defaultMessage, {ignoreTag: settings.ignoreTag})
    } catch (e) {
      context.report({
        node: messageNode,
        messageId: 'parseError',
        data: {error: (e as Error).message},
      })
      continue
    }
    const argument = findCount(ast, countPattern)
    if (argument !== undefined) {
      context.report({
        node: messageNode,
        messageId: 'countWithoutPlural' satisfies MessageIds,
        data: {argument},
      })
    }
  }
}

export const name = 'no-count-without-plural'

export const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Require an ICU plural when a count argument is followed by a noun',
      url: 'https://formatjs.github.io/docs/tooling/linter#no-count-without-plural',
    },
    messages: {
      ...CORE_MESSAGES,
      countWithoutPlural:
        'Put the noun after `{{argument}}` inside `{{{argument}}, plural, one {# …} other {# …}}`. Other locales inflect the noun for up to 6 plural categories; `{{{argument}}, number}` alone only localizes the digits.',
    },
    schema: [
      {
        type: 'object',
        properties: {
          countPattern: {type: 'string'},
        },
        additionalProperties: false,
      },
    ],
  },
  create(context) {
    const options = (context.options[0] ?? {}) as Options
    const countPattern = new RegExp(
      options.countPattern ?? DEFAULT_COUNT_PATTERN,
      'u'
    )
    const callExpressionVisitor = (node: Node) =>
      checkNode(context, node, countPattern)

    const parserServices = context.sourceCode.parserServices
    if (parserServices?.defineTemplateBodyVisitor) {
      return parserServices.defineTemplateBodyVisitor(
        {CallExpression: callExpressionVisitor},
        {CallExpression: callExpressionVisitor}
      )
    }
    return {
      JSXOpeningElement: (node: Node) => checkNode(context, node, countPattern),
      CallExpression: callExpressionVisitor,
    }
  },
}
