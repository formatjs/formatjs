import {type NumberSkeletonToken} from '@formatjs/icu-skeleton-parser'
import {
  type ArgumentElement,
  type DateElement,
  type DateTimeSkeleton,
  isArgumentElement,
  isDateElement,
  isLiteralElement,
  isNumberElement,
  isPluralElement,
  isPoundElement,
  isSelectElement,
  isTagElement,
  isTimeElement,
  type LiteralElement,
  type MessageFormatElement,
  type NumberElement,
  type PluralElement,
  type SelectElement,
  type Skeleton,
  SKELETON_TYPE,
  type TagElement,
  type TimeElement,
  TYPE,
} from '#packages/icu-messageformat-parser/types.js'

export function printAST(ast: MessageFormatElement[]): string {
  return doPrintAST(ast, false)
}

export function doPrintAST(
  ast: MessageFormatElement[],
  isInPlural: boolean
): string {
  const printedNodes = ast.map((el, i) => {
    if (isLiteralElement(el)) {
      return printLiteralElement(el, isInPlural, i === 0, i === ast.length - 1)
    }

    if (isArgumentElement(el)) {
      return printArgumentElement(el)
    }
    if (isDateElement(el) || isTimeElement(el) || isNumberElement(el)) {
      return printSimpleFormatElement(el)
    }

    if (isPluralElement(el)) {
      return printPluralElement(el)
    }

    if (isSelectElement(el)) {
      return printSelectElement(el)
    }

    if (isPoundElement(el)) {
      return '#'
    }
    if (isTagElement(el)) {
      return printTagElement(el)
    }
  })

  return printedNodes.join('')
}

function printTagElement(el: TagElement): string {
  return `<${el.value}>${printAST(el.children)}</${el.value}>`
}

function quoteSyntaxToken(token: string): string {
  return `'${token.split("'").join("''")}'`
}

function isAlpha(ch: string | undefined): boolean {
  if (!ch) {
    return false
  }
  const code = ch.charCodeAt(0)
  return (code >= 65 && code <= 90) || (code >= 97 && code <= 122)
}

function isTagSyntaxStart(message: string, index: number): boolean {
  if (message[index] !== '<') {
    return false
  }
  const next = message[index + 1]
  return next === '/' || isAlpha(next)
}

function findTagSyntaxEnd(message: string, index: number): number {
  const closingIndex = message.indexOf('>', index + 1)
  return closingIndex === -1 ? message.length : closingIndex + 1
}

function findBraceSyntaxEnd(message: string, index: number): number {
  const closingIndex = message.indexOf('}', index + 1)
  return closingIndex === -1 ? index + 1 : closingIndex + 1
}

function printEscapedMessage(message: string, isInPlural = false): string {
  let result = ''
  let literalStart = 0

  function quoteToken(start: number, end: number) {
    result += message.slice(literalStart, start)
    result += quoteSyntaxToken(message.slice(start, end))
    literalStart = end
  }

  for (let i = 0; i < message.length; i++) {
    const ch = message[i]
    if (ch === '{') {
      const end = findBraceSyntaxEnd(message, i)
      quoteToken(i, end)
      i = end - 1
    } else if (ch === '}') {
      quoteToken(i, i + 1)
    } else if (isTagSyntaxStart(message, i)) {
      const end = findTagSyntaxEnd(message, i)
      quoteToken(i, end)
      i = end - 1
    } else if (isInPlural && ch === '#') {
      quoteToken(i, i + 1)
    }
  }

  return result + message.slice(literalStart)
}

function printLiteralElement(
  {value}: LiteralElement,
  isInPlural: boolean,
  isFirstEl: boolean,
  isLastEl: boolean
) {
  let escaped = value
  // If this literal starts with a ' and its not the 1st node, this means the node before it is non-literal
  // and the `'` needs to be unescaped
  if (!isFirstEl && escaped[0] === `'`) {
    escaped = `''${escaped.slice(1)}`
  }
  // Same logic but for last el
  if (!isLastEl && escaped[escaped.length - 1] === `'`) {
    escaped = `${escaped.slice(0, escaped.length - 1)}''`
  }
  return printEscapedMessage(escaped, isInPlural)
}

function printArgumentElement({value}: ArgumentElement) {
  return `{${value}}`
}

function printSimpleFormatElement(
  el: DateElement | TimeElement | NumberElement
) {
  return `{${el.value}, ${TYPE[el.type]}${
    el.style ? `, ${printArgumentStyle(el.style)}` : ''
  }}`
}

function printNumberSkeletonToken(token: NumberSkeletonToken): string {
  const {stem, options} = token
  return options.length === 0
    ? stem
    : `${stem}${options.map(o => `/${o}`).join('')}`
}

function printArgumentStyle(style: string | Skeleton) {
  if (typeof style === 'string') {
    return printEscapedMessage(style)
  } else if (style.type === SKELETON_TYPE.dateTime) {
    return `::${printDateTimeSkeleton(style)}`
  } else {
    return `::${style.tokens.map(printNumberSkeletonToken).join(' ')}`
  }
}

export function printDateTimeSkeleton(style: DateTimeSkeleton): string {
  return style.pattern
}

function printSelectElement(el: SelectElement) {
  // Sort keys alphabetically for consistent output.
  // Mirrors write_select_element in crates/icu_messageformat_parser/printer.rs.
  const keys = Object.keys(el.options).sort()
  const msg = [
    el.value,
    'select',
    keys.map(id => `${id}{${doPrintAST(el.options[id].value, false)}}`).join(' '),
  ].join(',')
  return `{${msg}}`
}

/**
 * Returns the LDML sort order for a plural rule.
 *
 * LDML order is: zero, one, two, few, many, other, then =N exact matches sorted
 * numerically. Returns a [primary, secondary] tuple for sorting.
 *
 * Mirrors get_plural_rule_sort_order in crates/icu_messageformat_parser/printer.rs.
 */
function getPluralRuleSortOrder(rule: string): [number, number] {
  switch (rule) {
    case 'zero':
      return [0, 0]
    case 'one':
      return [1, 0]
    case 'two':
      return [2, 0]
    case 'few':
      return [3, 0]
    case 'many':
      return [4, 0]
    case 'other':
      return [5, 0]
    default: {
      // Extract the numeric value from exact matches like "=0", "=1".
      const num = parseInt(rule.replace(/^=+/, ''), 10)
      // Exact matches come after 'other', sorted numerically.
      return [6, Number.isNaN(num) ? 0 : num]
    }
  }
}

function printPluralElement(el: PluralElement) {
  const type = el.pluralType === 'cardinal' ? 'plural' : 'selectordinal'
  // Sort keys in LDML order: zero, one, two, few, many, other, then exact matches.
  // Mirrors write_plural_element in crates/icu_messageformat_parser/printer.rs.
  const keys = Object.keys(el.options).sort((a, b) => {
    const [pa, sa] = getPluralRuleSortOrder(a)
    const [pb, sb] = getPluralRuleSortOrder(b)
    return pa - pb || sa - sb
  })
  const msg = [
    el.value,
    type,
    [
      el.offset ? `offset:${el.offset}` : '',
      ...keys.map(id => `${id}{${doPrintAST(el.options[id].value, true)}}`),
    ]
      .filter(Boolean)
      .join(' '),
  ].join(',')
  return `{${msg}}`
}
