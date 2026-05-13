import type {IntlCollatorInternal} from '#packages/intl-collator/types.js'

const COMBINING_MARKS = /[\u0300-\u036f]/g
const ASCII_PUNCTUATION = /[!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]/g
const ASCII_DIGIT_RUN = /[0-9]+/g

function normalize(input: string): string {
  return typeof input.normalize === 'function' ? input.normalize('NFD') : input
}

function stripMarks(input: string): string {
  return input.replace(COMBINING_MARKS, '')
}

function stripPunctuation(input: string): string {
  return input.replace(ASCII_PUNCTUATION, '')
}

function prepare(input: string, slots: IntlCollatorInternal): string {
  let result = normalize(input)
  if (slots.ignorePunctuation) {
    result = stripPunctuation(result)
  }
  if (slots.sensitivity === 'base' || slots.sensitivity === 'case') {
    result = stripMarks(result)
  }
  if (
    slots.sensitivity === 'base' ||
    slots.sensitivity === 'accent' ||
    slots.caseFirst !== 'false'
  ) {
    result = result.toLocaleLowerCase(slots.locale)
  }
  return result
}

function compareStrings(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0
}

function compareNumeric(left: string, right: string): number {
  const leftParts = left.split(ASCII_DIGIT_RUN)
  const rightParts = right.split(ASCII_DIGIT_RUN)
  const leftDigits = left.match(ASCII_DIGIT_RUN) || []
  const rightDigits = right.match(ASCII_DIGIT_RUN) || []
  const length = Math.max(leftParts.length, rightParts.length)

  for (let i = 0; i < length; i++) {
    const partResult = compareStrings(leftParts[i] || '', rightParts[i] || '')
    if (partResult) {
      return partResult
    }

    const leftNumber = leftDigits[i]
    const rightNumber = rightDigits[i]
    if (leftNumber === undefined || rightNumber === undefined) {
      continue
    }

    const normalizedLeftNumber = leftNumber.replace(/^0+/, '') || '0'
    const normalizedRightNumber = rightNumber.replace(/^0+/, '') || '0'
    const lengthResult =
      normalizedLeftNumber.length - normalizedRightNumber.length
    if (lengthResult) {
      return lengthResult < 0 ? -1 : 1
    }
    const digitResult = compareStrings(
      normalizedLeftNumber,
      normalizedRightNumber
    )
    if (digitResult) {
      return digitResult
    }
  }

  return 0
}

function compareCaseFirst(
  left: string,
  right: string,
  locale: string,
  caseFirst: IntlCollatorInternal['caseFirst']
): number {
  if (caseFirst === 'false') {
    return 0
  }
  const length = Math.min(left.length, right.length)
  for (let i = 0; i < length; i++) {
    const leftChar = left.charAt(i)
    const rightChar = right.charAt(i)
    const lowerLeft = leftChar.toLocaleLowerCase(locale)
    const lowerRight = rightChar.toLocaleLowerCase(locale)
    if (lowerLeft !== lowerRight) {
      continue
    }
    const leftIsUpper = leftChar !== lowerLeft
    const rightIsUpper = rightChar !== lowerRight
    if (leftIsUpper !== rightIsUpper) {
      const upperResult = leftIsUpper ? -1 : 1
      return caseFirst === 'upper' ? upperResult : -upperResult
    }
  }
  return 0
}

export function compareCollatorStrings(
  slots: IntlCollatorInternal,
  x: string,
  y: string
): number {
  const left = prepare(x, slots)
  const right = prepare(y, slots)
  const result = slots.numeric
    ? compareNumeric(left, right)
    : compareStrings(left, right)
  if (result) {
    return result
  }
  return compareCaseFirst(x, y, slots.locale, slots.caseFirst)
}
