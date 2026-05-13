import type {IntlCollatorInternal} from '#packages/intl-collator/types.js'
import {collationLocaleData} from '@formatjs_generated/cldr.collation/locale-data.js'
import {
  rootElements,
  rootPrefixEntries,
  rootTrie,
  type PackedCollationElement,
  type PackedPrefixEntry,
  type PackedTrieNode,
} from '@formatjs_generated/cldr.collation/root.js'
import {
  collationTailorings,
  type PackedLDMLCollation,
  type PackedLDMLRelation,
  type PackedLDMLReset,
  type PackedLDMLRule,
} from '@formatjs_generated/cldr.collation/tailoring.js'

const COMBINING_MARKS = /[\u0300-\u036f]/g
const ASCII_PUNCTUATION = /[!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]/g
const ASCII_DIGIT_RUN = /[0-9]+/g
const IMPORT_COLLATION_RE = /^(.+)-u-co-([a-z0-9-]+)$/i

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

type TailoringEntry = {
  readonly codePoints: readonly number[]
  readonly elements: readonly PackedCollationElement[]
}

const tailoringCache = new Map<string, readonly TailoringEntry[]>()

function localeBase(locale: string): string {
  return locale.split('-u-')[0]
}

function collationForComparison(locale: string, collation: string): string {
  if (collation !== 'default') {
    return collation
  }
  return (
    (
      collationLocaleData as Record<
        string,
        {defaultCollation?: string} | undefined
      >
    )[locale]?.defaultCollation || collation
  )
}

function normalizeTailoringValue(value: string): string {
  return normalize(value)
}

function cloneElement(
  element: PackedCollationElement,
  level: number,
  weight: number
): PackedCollationElement {
  return [
    level === 0 ? weight : element[0],
    level === 1 ? weight : element[1],
    level === 2 ? weight : element[2],
    element[3],
    element[4],
  ]
}

function relationLevel(rule: PackedLDMLRelation): number {
  switch (rule[1]) {
    case 'primary':
      return 0
    case 'secondary':
      return 1
    case 'tertiary':
      return 2
    default:
      return 3
  }
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

function rootElementsForString(input: string): PackedCollationElement[] {
  const codePoints = stringToCodePoints(input)
  const elements: PackedCollationElement[] = []
  for (let i = 0; i < codePoints.length; ) {
    const match = lookupRootElements(codePoints, i)
    elements.push(...match.elements)
    i += match.length
  }
  return elements
}

function packedCollation(
  locale: string,
  collation: string
): PackedLDMLCollation | undefined {
  return (
    collationTailorings as Record<
      string,
      Record<string, PackedLDMLCollation> | undefined
    >
  )[locale]?.[collation]
}

function importedTailorings(
  rule: PackedLDMLRule,
  visited: Set<string>
): readonly TailoringEntry[] {
  if (
    rule[0] !== 'setting' ||
    rule[1] !== 'import' ||
    typeof rule[2] !== 'string'
  ) {
    return []
  }
  const imported = IMPORT_COLLATION_RE.exec(rule[2])
  return imported ? tailoringEntries(imported[1], imported[2], visited) : []
}

function addTailoredRelation(
  entries: TailoringEntry[],
  rule: PackedLDMLRelation,
  element: PackedCollationElement
) {
  const value = normalizeTailoringValue(rule[2])
  entries.push({
    codePoints: stringToCodePoints(value),
    elements: [element],
  })
}

function addTailoredRelationGroup(
  entries: TailoringEntry[],
  resetValue: string,
  before: 1 | 2 | 3 | undefined,
  relations: PackedLDMLRelation[]
) {
  const anchor = rootElementsForString(normalizeTailoringValue(resetValue))[0]
  if (!anchor) {
    return
  }

  const totalByLevel = [0, 0, 0, 0]
  for (const relation of relations) {
    totalByLevel[relationLevel(relation)]++
  }

  const seenByLevel = [0, 0, 0, 0]
  let previousElement = anchor
  for (const relation of relations) {
    const level = relationLevel(relation)
    seenByLevel[level]++
    const baseElement = level === 2 ? previousElement : anchor
    const anchorWeight = baseElement[level]
    const offset =
      before === level + 1
        ? seenByLevel[level] - totalByLevel[level] - 1
        : seenByLevel[level]
    const element = cloneElement(baseElement, level, anchorWeight + offset)
    previousElement = element
    addTailoredRelation(entries, relation, element)
  }
}

function tailoringEntries(
  locale: string,
  collation: string,
  visited = new Set<string>()
): readonly TailoringEntry[] {
  const key = `${locale}|${collation}`
  if (tailoringCache.has(key)) {
    return tailoringCache.get(key)!
  }
  if (visited.has(key)) {
    return []
  }
  visited.add(key)

  const collationData = packedCollation(locale, collation)
  const entries: TailoringEntry[] = []
  const rules = collationData?.rules || []
  let reset: PackedLDMLReset | undefined
  let relations: PackedLDMLRelation[] = []

  function flushRelations() {
    if (reset && relations.length > 0) {
      addTailoredRelationGroup(entries, reset[1], reset[2], relations)
    }
    relations = []
  }

  for (const rule of rules) {
    if (rule[0] === 'setting') {
      flushRelations()
      entries.push(...importedTailorings(rule, visited))
    } else if (rule[0] === 'reset') {
      flushRelations()
      reset = rule
    } else if (rule[0] === 'relation') {
      relations.push(rule)
    }
  }
  flushRelations()

  entries.sort((left, right) => right.codePoints.length - left.codePoints.length)
  tailoringCache.set(key, entries)
  return entries
}

function lookupTailoredElements(
  entries: readonly TailoringEntry[],
  codePoints: readonly number[],
  start: number
): {elements: readonly PackedCollationElement[]; length: number} | undefined {
  for (const entry of entries) {
    if (matchesAt(codePoints, start, entry.codePoints)) {
      return {elements: entry.elements, length: entry.codePoints.length}
    }
  }
  return undefined
}

function collationElements(
  input: string,
  tailoring: readonly TailoringEntry[]
): PackedCollationElement[] {
  const codePoints = stringToCodePoints(input)
  const elements: PackedCollationElement[] = []
  for (let i = 0; i < codePoints.length; ) {
    const match =
      lookupTailoredElements(tailoring, codePoints, i) ||
      lookupRootElements(codePoints, i)
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
  const locale = localeBase(slots.locale)
  const tailoring = tailoringEntries(
    locale,
    collationForComparison(locale, slots.collation)
  )
  return compareCollationElements(
    collationElements(left, tailoring),
    collationElements(right, tailoring),
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
