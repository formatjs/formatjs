import type {IntlCollatorInternal} from '#packages/intl-collator/types.js'
import {
  rootElements,
  rootPrefixEntries,
  rootTrie,
  type PackedCollationElement,
  type PackedPrefixEntry,
  type PackedTrieNode,
} from '@formatjs_generated/cldr.collation/root.js'

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

function compareNumbers(left: number, right: number): number {
  return left < right ? -1 : left > right ? 1 : 0
}

function stringToCodePoints(input: string): number[] {
  const codePoints: number[] = []
  for (let i = 0; i < input.length; i++) {
    const codePoint = input.codePointAt(i)
    if (codePoint === undefined) {
      continue
    }
    codePoints.push(codePoint)
    if (codePoint > 0xffff) {
      i++
    }
  }
  return codePoints
}

function fallbackElement(codePoint: number): PackedCollationElement {
  return [0xff0000 + codePoint, 0, 0, 0, 0]
}

function matchesAt(
  codePoints: readonly number[],
  start: number,
  expected: readonly number[]
): boolean {
  if (start + expected.length > codePoints.length) {
    return false
  }
  return expected.every(
    (codePoint, index) => codePoints[start + index] === codePoint
  )
}

function matchesBefore(
  codePoints: readonly number[],
  start: number,
  expected: readonly number[]
): boolean {
  if (start < expected.length) {
    return false
  }
  return expected.every(
    (codePoint, index) =>
      codePoints[start - expected.length + index] === codePoint
  )
}

function lookupPrefixElements(
  codePoints: readonly number[],
  start: number
): {elements: readonly PackedCollationElement[]; length: number} | undefined {
  let bestEntry: PackedPrefixEntry | undefined
  for (const entry of rootPrefixEntries) {
    if (
      matchesBefore(codePoints, start, entry.prefix) &&
      matchesAt(codePoints, start, entry.codePoints) &&
      (!bestEntry ||
        entry.prefix.length + entry.codePoints.length >
          bestEntry.prefix.length + bestEntry.codePoints.length)
    ) {
      bestEntry = entry
    }
  }

  return bestEntry
    ? {elements: bestEntry.elements, length: bestEntry.codePoints.length}
    : undefined
}

function lookupRootElements(
  codePoints: readonly number[],
  start: number
): {elements: readonly PackedCollationElement[]; length: number} {
  const prefixMatch = lookupPrefixElements(codePoints, start)
  if (prefixMatch) {
    return prefixMatch
  }

  let node: PackedTrieNode | undefined = rootTrie
  let matchedElements: readonly PackedCollationElement[] | undefined
  let matchedLength = 0

  for (let i = start; i < codePoints.length; i++) {
    node = node.next?.[codePoints[i]]
    if (!node) {
      break
    }
    if (node.value !== undefined) {
      matchedElements = rootElements[node.value]
      matchedLength = i - start + 1
    }
  }

  return matchedElements
    ? {elements: matchedElements, length: matchedLength}
    : {elements: [fallbackElement(codePoints[start])], length: 1}
}

function collationElements(input: string): PackedCollationElement[] {
  const codePoints = stringToCodePoints(input)
  const elements: PackedCollationElement[] = []
  for (let i = 0; i < codePoints.length; ) {
    const match = lookupRootElements(codePoints, i)
    elements.push(...match.elements)
    i += match.length
  }
  return elements
}

function levelCount(slots: IntlCollatorInternal): number {
  switch (slots.sensitivity) {
    case 'base':
      return 1
    case 'accent':
      return 2
    case 'case':
      return 3
    default:
      return 4
  }
}

function compareCollationElements(
  left: readonly PackedCollationElement[],
  right: readonly PackedCollationElement[],
  levels: number
): number {
  for (let level = 0; level < levels; level++) {
    const leftWeights = left
      .map(element => element[level])
      .filter(weight => weight !== 0)
    const rightWeights = right
      .map(element => element[level])
      .filter(weight => weight !== 0)
    const length = Math.max(leftWeights.length, rightWeights.length)
    for (let i = 0; i < length; i++) {
      const result = compareNumbers(leftWeights[i] || 0, rightWeights[i] || 0)
      if (result) {
        return result
      }
    }
  }
  return 0
}

function comparePreparedStrings(
  left: string,
  right: string,
  slots: IntlCollatorInternal
): number {
  return compareCollationElements(
    collationElements(left),
    collationElements(right),
    levelCount(slots)
  )
}

function compareNumeric(
  left: string,
  right: string,
  slots: IntlCollatorInternal
): number {
  const leftParts = left.split(ASCII_DIGIT_RUN)
  const rightParts = right.split(ASCII_DIGIT_RUN)
  const leftDigits = left.match(ASCII_DIGIT_RUN) || []
  const rightDigits = right.match(ASCII_DIGIT_RUN) || []
  const length = Math.max(leftParts.length, rightParts.length)

  for (let i = 0; i < length; i++) {
    const partResult = comparePreparedStrings(
      leftParts[i] || '',
      rightParts[i] || '',
      slots
    )
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
    ? compareNumeric(left, right, slots)
    : comparePreparedStrings(left, right, slots)
  if (result) {
    return result
  }
  return compareCaseFirst(x, y, slots.locale, slots.caseFirst)
}
