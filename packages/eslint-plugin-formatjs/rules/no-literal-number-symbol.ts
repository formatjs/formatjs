import {
  isNumberSkeleton,
  type MessageFormatElement,
  type NumberElement,
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

type SymbolKind = 'percent' | 'permille' | 'sign' | 'currency' | 'degree'

type MessageIds =
  | 'literalPercent'
  | 'literalPermille'
  | 'literalSign'
  | 'literalCurrency'
  | 'literalDegree'
  | CoreMessageIds

const MESSAGE_IDS: Record<SymbolKind, MessageIds> = {
  percent: 'literalPercent',
  permille: 'literalPermille',
  sign: 'literalSign',
  currency: 'literalCurrency',
  degree: 'literalDegree',
}

// Stems that make ICU render the symbol itself, in the locale's form and
// position. A literal next to the argument pins the English one instead.
const SATISFYING_STEMS: Record<SymbolKind, ReadonlySet<string>> = {
  percent: new Set(['percent', '%']),
  permille: new Set(['permille']),
  sign: new Set([
    'sign-always',
    'sign-except-zero',
    'sign-accounting-always',
    'sign-accounting-except-zero',
    '+!',
    '+?',
    '()!',
    '()?',
  ]),
  currency: new Set(['currency']),
  degree: new Set(['unit', 'measure-unit']),
}

const SIMPLE_STYLES: Partial<Record<SymbolKind, string>> = {
  percent: 'percent',
  currency: 'currency',
}

// Optional single space, NBSP or NNBSP between the number and the symbol,
// since "50 %" and "10 €" are as wrong as "50%" for other locales.
const GAP = '[ \\u00a0\\u202f]?'
const SUFFIXES: ReadonlyArray<[SymbolKind, RegExp]> = [
  ['percent', new RegExp(`^${GAP}[%٪﹪％]`, 'u')],
  ['permille', new RegExp(`^${GAP}[‰؉]`, 'u')],
  ['degree', new RegExp(`^${GAP}(?:°|℃|℉)`, 'u')],
  ['currency', new RegExp(`^${GAP}\\p{Sc}`, 'u')],
]
const PREFIXES: ReadonlyArray<[SymbolKind, RegExp]> = [
  ['percent', new RegExp(`[%٪﹪％]${GAP}$`, 'u')],
  ['permille', new RegExp(`[‰؉]${GAP}$`, 'u')],
  ['currency', new RegExp(`\\p{Sc}${GAP}$`, 'u')],
]
// A sign glued to the number, after the start of the message or a space or
// opening bracket. `{a}-{b}` and `{a} + {b}` are ranges and arithmetic.
const SIGN_PREFIX = /(^|[\s([])[+\-−＋－﹢﹣]$/u

function satisfies(element: NumberElement, kind: SymbolKind): boolean {
  const {style} = element
  if (!style) {
    return false
  }
  if (typeof style === 'string') {
    return SIMPLE_STYLES[kind] === style
  }
  return (
    isNumberSkeleton(style) &&
    style.tokens.some(({stem}) => SATISFYING_STEMS[kind].has(stem))
  )
}

function literalAt(ast: MessageFormatElement[], index: number): string | null {
  const element = ast[index]
  return element?.type === TYPE.literal ? element.value : null
}

function symbolsNextTo(ast: MessageFormatElement[], index: number) {
  const kinds = new Set<SymbolKind>()
  const after = literalAt(ast, index + 1)
  const before = literalAt(ast, index - 1)
  if (after !== null) {
    for (const [kind, pattern] of SUFFIXES) {
      if (pattern.test(after)) kinds.add(kind)
    }
  }
  if (before !== null) {
    for (const [kind, pattern] of PREFIXES) {
      if (pattern.test(before)) kinds.add(kind)
    }
    const sign = SIGN_PREFIX.exec(before)
    // A bare "-" literal right after another placeholder is a range.
    if (sign && (sign[1] !== '' || index - 1 === 0)) {
      kinds.add('sign')
    }
  }
  return kinds
}

function verifyAst(
  ast: MessageFormatElement[],
  errors: {messageId: MessageIds; data: Record<string, string>}[]
): void {
  for (const [index, element] of ast.entries()) {
    switch (element.type) {
      case TYPE.argument:
      case TYPE.number: {
        for (const kind of symbolsNextTo(ast, index)) {
          if (element.type === TYPE.number && satisfies(element, kind)) {
            continue
          }
          errors.push({
            messageId: MESSAGE_IDS[kind],
            data: {argument: element.value},
          })
        }
        break
      }
      case TYPE.plural:
      case TYPE.select:
        for (const option of Object.values(element.options)) {
          verifyAst(option.value, errors)
        }
        break
      case TYPE.tag:
        verifyAst(element.children, errors)
        break
      default:
        break
    }
  }
}

function checkNode(context: Rule.RuleContext, node: Node) {
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
    const errors: {messageId: MessageIds; data: Record<string, string>}[] = []
    verifyAst(ast, errors)
    for (const error of errors) {
      context.report({node: messageNode, ...error})
    }
  }
}

export const name = 'no-literal-number-symbol'

export const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow literal percent, per mille, sign, currency and degree symbols next to a number argument',
      url: 'https://formatjs.github.io/docs/tooling/linter#no-literal-number-symbol',
    },
    messages: {
      ...CORE_MESSAGES,
      literalPercent:
        'Format `{{argument}}` with `::percent` and pass a ratio instead of writing a literal percent sign. Locales control the symbol, spacing and position.',
      literalPermille:
        'Format `{{argument}}` with `::permille` and pass a ratio instead of writing a literal per mille sign.',
      literalSign:
        'Format `{{argument}}` with `::sign-always` (or `sign-except-zero`) instead of writing a literal plus or minus sign. Locales control the sign glyph and position.',
      literalCurrency:
        'Format `{{argument}}` with `::currency/XXX` instead of writing a literal currency symbol. Locales control the symbol, spacing and position.',
      literalDegree:
        'Format `{{argument}}` with `::unit/celsius`, `::unit/fahrenheit` or `::unit/degree` instead of writing a literal degree sign.',
    },
    schema: [],
  },
  create(context) {
    const callExpressionVisitor = (node: Node) => checkNode(context, node)

    const parserServices = context.sourceCode.parserServices
    if (parserServices?.defineTemplateBodyVisitor) {
      return parserServices.defineTemplateBodyVisitor(
        {CallExpression: callExpressionVisitor},
        {CallExpression: callExpressionVisitor}
      )
    }
    return {
      JSXOpeningElement: (node: Node) => checkNode(context, node),
      CallExpression: callExpressionVisitor,
    }
  },
}
