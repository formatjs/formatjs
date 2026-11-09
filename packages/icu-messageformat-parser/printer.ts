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
  isInPlural: boolean,
  isAtEndOfMessage = true
): string {
  const elements: MessageFormatElement[] = []
  for (const el of ast) {
    const previous = elements[elements.length - 1]
    if (previous && isLiteralElement(previous) && isLiteralElement(el)) {
      elements[elements.length - 1] = {
        type: TYPE.literal,
        value: previous.value + el.value,
        ...(previous.rawValue !== undefined &&
          el.rawValue !== undefined && {
            rawValue: previous.rawValue + el.rawValue,
          }),
      }
    } else {
      elements.push(el)
    }
  }
  const printedNodes = elements.map((el, i) => {
    if (isLiteralElement(el)) {
      return printLiteralElement(
        el,
        isInPlural,
        isAtEndOfMessage && i === elements.length - 1,
        isAtEndOfMessage
      )
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
      return printTagElement(el, isInPlural)
    }
  })

  return printedNodes.join('')
}

function printTagElement(el: TagElement, isInPlural: boolean): string {
  return `<${el.value}>${doPrintAST(el.children, isInPlural, false)}</${el.value}>`
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

function printEscapedMessage(
  message: string,
  isInPlural = false,
  preserveApostrophes = false
): string {
  let result = ''
  let literalStart = 0
  let quotedStart = -1
  let quotedEnd = -1

  function flushQuotedToken() {
    if (quotedStart === -1) {
      return
    }

    const literal = message.slice(literalStart, quotedStart)
    result += preserveApostrophes ? literal : literal.replace(/'/g, "''")
    if (preserveApostrophes && literal.endsWith("'")) {
      result += "'"
    }
    result += quoteSyntaxToken(message.slice(quotedStart, quotedEnd))
    literalStart = quotedEnd
    quotedStart = -1
  }

  function quoteToken(start: number, end: number) {
    if (
      quotedStart !== -1 &&
      (start === quotedEnd ||
        (!preserveApostrophes && /^'*$/.test(message.slice(quotedEnd, start))))
    ) {
      quotedEnd = end
      return
    }

    flushQuotedToken()
    quotedStart = start
    quotedEnd = end
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

  flushQuotedToken()
  const tail = message.slice(literalStart)
  return result + (preserveApostrophes ? tail : tail.replace(/'/g, "''"))
}

function validatedRawValue(
  rawValue: string,
  value: string,
  isInPlural: boolean,
  isAtEndOfMessage: boolean,
  isTopLevel: boolean
): string | undefined {
  let decoded = ''
  let index = 0
  let closeQuote = false
  while (index < rawValue.length) {
    const ch = rawValue[index++]
    if (ch === "'") {
      const next = rawValue[index]
      if (next === "'") {
        decoded += "'"
        index++
        continue
      }
      if (
        next === '{' ||
        next === '}' ||
        next === '<' ||
        next === '>' ||
        (isInPlural && next === '#')
      ) {
        let closed = false
        while (index < rawValue.length) {
          const quoted = rawValue[index++]
          if (quoted === "'") {
            if (rawValue[index] === "'") {
              decoded += "'"
              index++
            } else {
              closed = true
              break
            }
          } else {
            decoded += quoted
          }
        }
        closeQuote = !closed && !isAtEndOfMessage
        continue
      }
      if (index === rawValue.length && !isAtEndOfMessage) closeQuote = true
    }
    // Raw spelling must remain literal in the destination context.
    if (
      ch === '{' ||
      (!isTopLevel && ch === '}') ||
      (isInPlural && ch === '#') ||
      isTagSyntaxStart(rawValue, index - 1)
    )
      return undefined
    decoded += ch
  }
  return decoded === value ? rawValue + (closeQuote ? "'" : '') : undefined
}

function printLiteralElement(
  {value, rawValue}: LiteralElement,
  isInPlural: boolean,
  isAtEndOfMessage: boolean,
  isTopLevel: boolean
) {
  const captured =
    rawValue === undefined
      ? undefined
      : validatedRawValue(
          rawValue,
          value,
          isInPlural,
          isAtEndOfMessage,
          isTopLevel
        )
  return captured ?? printEscapedMessage(value, isInPlural)
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
    return printEscapedMessage(style, false, true)
  } else if (style.type === SKELETON_TYPE.dateTime) {
    return `::${printDateTimeSkeleton(style)}`
  } else {
    return `::${style.tokens.map(printNumberSkeletonToken).join(' ')}`
  }
}

export function printDateTimeSkeleton(style: DateTimeSkeleton): string {
  return style.pattern
}

// Rust string ordering is UTF-8 lexicographic, which matches code point order.
function compareCodePoints(a: string, b: string): number {
  const aIter = a[Symbol.iterator]()
  const bIter = b[Symbol.iterator]()

  while (true) {
    const aNext = aIter.next()
    const bNext = bIter.next()
    if (aNext.done || bNext.done) {
      return aNext.done === bNext.done ? 0 : aNext.done ? -1 : 1
    }

    const diff = aNext.value.codePointAt(0)! - bNext.value.codePointAt(0)!
    if (diff !== 0) {
      return diff
    }
  }
}

function printSelectElement(el: SelectElement) {
  const keys = Object.keys(el.options).sort(compareCodePoints)
  const msg = [
    el.value,
    'select',
    keys
      .map(id => `${id}{${doPrintAST(el.options[id].value, false, false)}}`)
      .join(' '),
  ].join(',')
  return `{${msg}}`
}

const PLURAL_RULE_ORDER: Record<string, number> = {
  zero: 0,
  one: 1,
  two: 2,
  few: 3,
  many: 4,
  other: 5,
}

function getPluralRuleSortOrder(rule: string): [number, number] {
  const categoryOrder = PLURAL_RULE_ORDER[rule]
  if (categoryOrder !== undefined) {
    return [categoryOrder, 0]
  }

  const exactRule = rule.replace(/^=+/, '')
  const exactValue = /^[+-]?\d+$/.test(exactRule) ? Number(exactRule) : 0
  return [6, exactValue]
}

function printPluralElement(el: PluralElement) {
  const type = el.pluralType === 'cardinal' ? 'plural' : 'selectordinal'
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
      ...keys.map(
        id => `${id}{${doPrintAST(el.options[id].value, true, false)}}`
      ),
    ]
      .filter(Boolean)
      .join(' '),
  ].join(',')
  return `{${msg}}`
}
