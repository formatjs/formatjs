import type {
  CollatorSlots,
  IntlCollatorInternal,
} from '#packages/intl-collator/types.js'
import {setDataProperty} from '#packages/ecma262-abstract/intrinsics.js'
import {
  combiningClasses,
  decimalDigitZeros,
  hanImplicitStart,
  hanRanges,
  hanRanks,
  hanWeightStep,
  numericOrderingElement,
  primaryReordering,
  rootElements,
  rootLogicalResets,
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
} from '@formatjs_generated/cldr.collation/tailoring.js'

const IMPORT_COLLATION_RE = /^(.+?)(?:-u-co-([a-z0-9-]+))?$/i
const VARIABLE = 1
const NUMERIC_PAYLOAD = 2
const MERGE_SEPARATOR = 8
const CASE_OVERRIDE = 64
const SCALED_PRIMARY = 128
const CASE_SHIFT = 4
const PRIMARY_SCALE = 0x2000
const REORDERING_STRIDE = 0x100000000 * PRIMARY_SCALE
const unassignedStart =
  primaryReordering.starts[primaryReordering.codes.unassigned]
const apply = Reflect.apply
const normalizeString = String.prototype.normalize
const codePointAt = String.prototype.codePointAt
const stringSlice = String.prototype.slice
const lastIndexOf = String.prototype.lastIndexOf
const hasOwn = Object.prototype.hasOwnProperty
const isArray = Array.isArray
const MapConstructor = Map
const mapGet = Map.prototype.get
const mapSet = Map.prototype.set
const regexpExec = RegExp.prototype.exec
const SetConstructor = Set
const setHas = Set.prototype.has
const setAdd = Set.prototype.add
const setDelete = Set.prototype.delete

// ECMA-402 leaves CompareStrings locale-sensitive ordering
// implementation-defined; this implementation maps the resolved Collator
// options onto UCA/CLDR collation element levels.
// https://tc39.es/ecma402/#sec-collator-comparestrings

function normalize(input: string): string {
  return typeof normalizeString === 'function'
    ? apply(normalizeString, input, ['NFD'])
    : input
}

function compareNumbers(left: number, right: number): number {
  return left < right ? -1 : left > right ? 1 : 0
}

function stringToCodePoints(input: string): number[] {
  const codePoints: number[] = []
  for (let i = 0; i < input.length; i++) {
    const codePoint = apply(codePointAt, input, [i])
    if (codePoint === undefined) {
      continue
    }
    append(codePoints, codePoint)
    if (codePoint > 0xffff) {
      i++
    }
  }
  return codePoints
}

function fallbackElement(codePoint: number): PackedCollationElement {
  // UTS #10 §10.1.1–3 gives lone surrogates unassigned weights. Han uses
  // CLDR radical-stroke order. Both groups sort before trailing weights.
  // https://www.unicode.org/reports/tr10/#Implicit_Weights
  let lo = 0
  let hi = hanRanges.length
  while (lo < hi) {
    const mid = (lo + hi) >>> 1
    const range = hanRanges[mid]
    const start = range[0]
    if (codePoint < start) hi = mid
    else if (codePoint >= range[1]) lo = mid + 1
    else {
      return [
        hanImplicitStart +
          hanRanks[range[2] + codePoint - start] * hanWeightStep,
        5,
        5,
        0,
        0,
      ]
    }
  }
  return [unassignedStart + codePoint + 1, 5, 5, 0, 0]
}

type TailoringEntry = {
  readonly prefix: readonly number[]
  readonly codePoints: readonly number[]
  readonly elements: readonly PackedCollationElement[]
}

type TailoringEntries = Map<number, TailoringEntry[]>

type TailoringMappings = {
  entries: TailoringEntries
  suppressed: Set<number>
}
const emptyMappings: TailoringMappings = {
  entries: new MapConstructor(),
  suppressed: new SetConstructor(),
}

type CompiledTailoring = TailoringMappings & {
  backwardsSecondary: boolean
  reordering?: readonly number[]
  tertiaryStrength?: boolean
}

const tailoringCache = new Map<string, CompiledTailoring>()
const getTailoring = tailoringCache.get.bind(tailoringCache)
const cacheTailoring = tailoringCache.set.bind(tailoringCache)

// LDML inserts omitted core groups first and expands "others" in root order.
// https://www.unicode.org/reports/tr35/tr35-collation.html#Script_Reordering
function compileReordering(codes: readonly string[]): number[] {
  const groups: number[] = []
  const explicit = new SetConstructor<number>()
  for (let i = 0; i < codes.length; i++) {
    const code = codes[i]
    if (code === 'others' || code === 'Zzzz') {
      append(groups, -1)
      continue
    }
    const group = ownValue(primaryReordering.codes, code)
    if (group === undefined || apply(setHas, explicit, [group])) continue
    append(groups, group)
    apply(setAdd, explicit, [group])
  }
  const ranks: number[] = []
  let rank = 1
  const core = ['space', 'punct', 'symbol', 'currency', 'digit']
  for (let i = 0; i < core.length; i++) {
    const group = primaryReordering.codes[core[i]]
    if (apply(setHas, explicit, [group])) continue
    setDataProperty(ranks, group, rank++)
    apply(setAdd, explicit, [group])
  }
  let placedOthers = false
  for (let i = 0; i <= groups.length; i++) {
    const group = i < groups.length ? groups[i] : -1
    if (group !== -1) {
      setDataProperty(ranks, group, rank++)
    } else if (!placedOthers) {
      for (let other = 0; other < primaryReordering.starts.length; other++) {
        if (!apply(setHas, explicit, [other]))
          setDataProperty(ranks, other, rank++)
      }
      placedOthers = true
    }
  }
  return ranks
}

function reorderPrimary(weight: number, ranks: readonly number[]): number {
  const {starts, trailing} = primaryReordering
  // The field separator and the trailing block have fixed positions.
  const primary = weight / PRIMARY_SCALE
  if (primary < starts[0]) return weight
  if (primary >= trailing)
    return (ranks.length + 1) * REORDERING_STRIDE + weight
  let lo = 0
  let hi = starts.length
  while (lo < hi) {
    const mid = (lo + hi) >>> 1
    if (starts[mid] <= primary) lo = mid + 1
    else hi = mid
  }
  return ranks[lo - 1] * REORDERING_STRIDE + weight
}

// CompareStrings uses private lists and records. Ignore inherited properties.
// https://tc39.es/ecma402/#sec-collator-comparestrings
function append<T>(list: T[], value: T): void {
  setDataProperty(list, list.length, value)
}

function appendAll<T>(list: T[], values: readonly T[]): void {
  for (let i = 0; i < values.length; i++) append(list, values[i])
}

function ownValue<T extends object, K extends keyof T>(
  record: T,
  key: K
): T[K] | undefined {
  return apply(hasOwn, record, [key]) ? record[key] : undefined
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
    level === 3 ? weight : element[3],
    level === 0 ? element[4] | SCALED_PRIMARY : element[4],
  ]
}

function relationLevel(rule: PackedLDMLRelation): number {
  // LDML relation operators map to UCA strength levels: < primary, <<
  // secondary, <<< tertiary, <<<< quaternary, and = identical.
  // https://www.unicode.org/reports/tr35/tr35-collation.html#Orderings
  switch (rule[1]) {
    case 'primary':
      return 0
    case 'secondary':
      return 1
    case 'tertiary':
      return 2
    case 'quaternary':
      return 3
    default:
      return 4
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
  for (let i = 0; i < expected.length; i++)
    if (codePoints[start + i] !== expected[i]) return false
  return true
}

function matchesBefore(
  codePoints: readonly number[],
  start: number,
  expected: readonly number[]
): boolean {
  return (
    start >= expected.length &&
    matchesAt(codePoints, start - expected.length, expected)
  )
}

function lookupPrefixElements(
  codePoints: readonly number[],
  start: number,
  context: readonly number[],
  contextStart: number
): PackedPrefixEntry | undefined {
  // UCA supports context-sensitive mappings. CLDR FractionalUCA encodes these
  // as prefix + code point sequences, so choose the longest applicable prefix
  // match before falling back to the root trie.
  // https://www.unicode.org/reports/tr10/#Contextual_Sensitive_Mappings
  let bestEntry: PackedPrefixEntry | undefined
  for (let i = 0; i < rootPrefixEntries.length; i++) {
    const entry = rootPrefixEntries[i]
    if (
      matchesBefore(context, contextStart, entry.prefix) &&
      matchesAt(codePoints, start, entry.codePoints) &&
      (!bestEntry ||
        entry.prefix.length > bestEntry.prefix.length ||
        (entry.prefix.length === bestEntry.prefix.length &&
          entry.codePoints.length > bestEntry.codePoints.length))
    ) {
      bestEntry = entry
    }
  }

  return bestEntry
}

function lookupRootElements(
  codePoints: readonly number[],
  start: number,
  tailored: TailoringEntry | undefined,
  suppressRootContext: boolean,
  context: readonly number[],
  contextStart: number
): {elements: readonly PackedCollationElement[]; length: number} {
  const prefixMatch = suppressRootContext
    ? undefined
    : lookupPrefixElements(codePoints, start, context, contextStart)
  // Prefer the longest prefix, then the longest target within that prefix.
  // A tailored mapping replaces the matching root entry.
  // https://www.unicode.org/reports/tr35/tr35-collation.html#Context-Sensitive_Mappings
  if (prefixMatch || tailored?.prefix.length) {
    const match =
      tailored &&
      (!prefixMatch ||
        tailored.prefix.length > prefixMatch.prefix.length ||
        (tailored.prefix.length === prefixMatch.prefix.length &&
          tailored.codePoints.length >= prefixMatch.codePoints.length))
        ? tailored
        : prefixMatch!
    return {elements: match.elements, length: match.codePoints.length}
  }

  let node: PackedTrieNode | undefined = rootTrie
  let matchedElements: readonly PackedCollationElement[] | undefined
  let matchedLength = 0

  // UCA collation element lookup is longest-match so contractions such as
  // multi-code-point sequences beat their shorter prefixes.
  // https://www.unicode.org/reports/tr10/#Contractions
  const end = suppressRootContext ? start + 1 : codePoints.length
  for (let i = start; i < end; i++) {
    const next: PackedTrieNode['next'] = ownValue(node, 'next')
    node = next && ownValue(next, codePoints[i])
    if (!node) {
      break
    }
    const value = ownValue(node, 'value')
    if (value !== undefined) {
      matchedElements = rootElements[value]
      matchedLength = i - start + 1
    }
  }

  if (tailored && tailored.codePoints.length >= matchedLength) {
    return {elements: tailored.elements, length: tailored.codePoints.length}
  }
  return matchedElements
    ? {elements: matchedElements, length: matchedLength}
    : {elements: [fallbackElement(codePoints[start])], length: 1}
}

function rootElementsForString(input: string): PackedCollationElement[] {
  return collationElements(input, emptyMappings, false)
}

function packedCollation(
  locale: string,
  collation: string
): PackedLDMLCollation | undefined {
  const data = ownValue(
    collationTailorings as Record<string, Record<string, PackedLDMLCollation>>,
    locale
  )
  return data && ownValue(data, collation)
}

function addTailoredRelation(
  mappings: TailoringMappings,
  rule: PackedLDMLRelation,
  elements: readonly PackedCollationElement[]
) {
  const value = normalizeTailoringValue(rule[2])
  const rootCases: number[] = []
  const root = rootElementsForString(value)
  for (let i = 0; i < root.length; i++) {
    if (root[i][0] !== 0) append(rootCases, elementCase(root[i]))
  }
  let primaryCount = 0
  for (let i = 0; i < elements.length; i++) {
    if (elements[i][0] !== 0) primaryCount++
  }
  // LDML distributes root case bits across tailored primary CEs.
  // https://www.unicode.org/reports/tr35/tr35-collation.html#Case_Parameters
  const tailored: PackedCollationElement[] = []
  let index = 0
  for (let i = 0; i < elements.length; i++) {
    const element = elements[i]
    if (element[0] === 0) {
      append(tailored, element)
      continue
    }
    let caseWeight = index < rootCases.length ? rootCases[index] : 0
    if (index === primaryCount - 1) {
      for (let j = index + 1; j < rootCases.length; j++) {
        if (rootCases[j] !== caseWeight) {
          caseWeight = 1
          break
        }
      }
    }
    append(tailored, [
      element[0],
      element[1],
      element[2],
      element[3],
      (element[4] & ~(3 << CASE_SHIFT)) |
        CASE_OVERRIDE |
        (caseWeight << CASE_SHIFT),
    ])
    index++
  }
  // Extension CEs keep their own weights and case bits.
  // https://www.unicode.org/reports/tr35/tr35-collation.html#Expansions
  if (rule[3])
    appendAll(tailored, collationElements(normalize(rule[3]), mappings, false))
  const codePoints = stringToCodePoints(value)
  if (!codePoints.length) return
  let bucket = apply(mapGet, mappings.entries, [codePoints[0]]) as
    | TailoringEntry[]
    | undefined
  if (!bucket) {
    bucket = []
    apply(mapSet, mappings.entries, [codePoints[0], bucket])
  }
  append(bucket, {
    prefix: rule[4] ? stringToCodePoints(normalize(rule[4])) : [],
    codePoints,
    elements: tailored,
  })
}

function addTailoredRelationGroup(
  mappings: TailoringMappings,
  resetValue: string,
  before: 1 | 2 | 3 | undefined,
  relations: PackedLDMLRelation[]
) {
  // LDML rule chains are a reset (&) followed by relations. [before n] inserts
  // relations before the reset at the requested strength; otherwise each
  // relation is assigned weights after the reset anchor.
  // https://www.unicode.org/reports/tr35/tr35-collation.html#Orderings
  // https://www.unicode.org/reports/tr35/tr35-collation.html#Logical_Reset_Positions
  const logical = ownValue(rootLogicalResets, resetValue)
  const root = logical
    ? [logical]
    : collationElements(normalizeTailoringValue(resetValue), mappings, false)
  const anchorElements: PackedCollationElement[] = []
  for (let i = 0; i < root.length; i++) {
    const element = root[i]
    // Tailoring adjusts the tertiary value independently of the root case bits.
    // https://www.unicode.org/reports/tr35/tr35-collation.html#Case_Parameters
    append(anchorElements, [
      element[0],
      element[1],
      tertiaryWeight(element),
      element[3],
      element[4] | CASE_OVERRIDE,
    ])
  }
  if (!anchorElements.length) {
    return
  }

  const totalByLevel = [0, 0, 0, 0, 0]
  for (let i = 0; i < relations.length; i++)
    totalByLevel[relationLevel(relations[i])]++

  const seenByLevel = [0, 0, 0, 0]
  let previousElements = anchorElements
  let secondaryAnchor = anchorElements
  for (let i = 0; i < relations.length; i++) {
    const relation = relations[i]
    const level = relationLevel(relation)
    if (level === 4) {
      addTailoredRelation(mappings, relation, previousElements)
      continue
    }
    seenByLevel[level]++
    // LDML Part 5 §3.4 Orderings: modify the last CE at the operator's
    // strength or stronger, preserving preceding expansion elements.
    // https://www.unicode.org/reports/tr35/tr35-collation.html#Orderings
    // https://github.com/unicode-org/cldr/blob/acd6d88ae493633240e19a87a721076a8a75c310/docs/ldml/tr35-collation.md#L765-L775
    const source =
      level >= 2
        ? previousElements
        : level === 1
          ? secondaryAnchor
          : anchorElements
    let index = source.length - 1
    for (; index >= 0; index--) {
      let weight = 0
      while (weight <= level && source[index][weight] === 0) weight++
      if (weight <= level) break
    }
    const baseElement: PackedCollationElement =
      index < 0 ? [0, 0, 0, 0, 0] : source[index]
    const anchorWeight =
      level === 0 ? primaryWeight(baseElement) : baseElement[level]
    const offset =
      before === level + 1 &&
      (level !== 1 || secondaryAnchor === anchorElements)
        ? seenByLevel[level] - totalByLevel[level] - 1
        : seenByLevel[level]
    const element = cloneElement(baseElement, level, anchorWeight + offset)
    previousElements = []
    for (let j = 0; j < index; j++) append(previousElements, source[j])
    append(previousElements, element)
    // A secondary relation stays within the most recent primary group.
    // https://www.unicode.org/reports/tr35/tr35-collation.html#Orderings
    if (level === 0) {
      secondaryAnchor = previousElements
      seenByLevel[1] = 0
    }
    addTailoredRelation(mappings, relation, previousElements)
  }
}

function findTailoringLocale(locale: string, collation: string): string {
  while (locale !== 'root' && !packedCollation(locale, collation)) {
    const separator = apply(lastIndexOf, locale, ['-'])
    locale = separator < 0 ? 'root' : apply(stringSlice, locale, [0, separator])
  }
  return locale
}

function suppressContractions(
  mappings: TailoringMappings,
  points: readonly number[]
) {
  // Remove existing contexts for these targets. Later rules may add them again.
  // https://www.unicode.org/reports/tr35/tr35-collation.html#Special_Purpose_Commands
  for (let i = 0; i < points.length; i++) {
    const point = points[i]
    apply(setAdd, mappings.suppressed, [point])
    const bucket = apply(mapGet, mappings.entries, [point]) as
      | TailoringEntry[]
      | undefined
    if (!bucket) continue
    const singles: TailoringEntry[] = []
    for (let j = 0; j < bucket.length; j++) {
      if (!bucket[j].prefix.length && bucket[j].codePoints.length === 1)
        append(singles, bucket[j])
    }
    apply(mapSet, mappings.entries, [point, singles])
  }
}

function applyTailoring(
  locale: string,
  collation: string,
  tailoring: CompiledTailoring,
  active: Set<string>
) {
  const key = locale + '|' + collation
  if (apply(setHas, active, [key])) return
  apply(setAdd, active, [key])
  const collationData = packedCollation(locale, collation)
  const rules = (collationData && ownValue(collationData, 'rules')) || []
  let reset: PackedLDMLReset | undefined
  let relations: PackedLDMLRelation[] = []

  function flushRelations() {
    if (reset && relations.length > 0) {
      addTailoredRelationGroup(tailoring, reset[1], reset[2], relations)
    }
    relations = []
  }

  for (let i = 0; i < rules.length; i++) {
    const rule = rules[i]
    if (rule[0] === 'setting') {
      flushRelations()
      reset = undefined
      const value = rule[2]
      if (rule[1] === 'backwards') tailoring.backwardsSecondary = value === '2'
      if (rule[1] === 'reorder' && isArray(value))
        tailoring.reordering = compileReordering(value as readonly string[])
      if (rule[1] === 'strength') tailoring.tertiaryStrength = value === '3'
      if (rule[1] === 'suppressContractions' && isArray(value))
        suppressContractions(tailoring, value as readonly number[])
      // Apply imported rules to the current mappings in this order.
      // https://www.unicode.org/reports/tr35/tr35-collation.html#Special_Purpose_Commands
      if (rule[1] === 'import' && typeof value === 'string') {
        const imported = apply(regexpExec, IMPORT_COLLATION_RE, [value])
        if (imported) {
          const type = imported[2] || 'standard'
          const source = findTailoringLocale(
            imported[1] === 'und' ? 'root' : imported[1],
            type
          )
          applyTailoring(source, type, tailoring, active)
        }
      }
    } else if (rule[0] === 'reset') {
      flushRelations()
      reset = rule
    } else if (rule[0] === 'relation') {
      append(relations, rule)
    }
  }
  flushRelations()
  apply(setDelete, active, [key])
}

function tailoringEntries(
  locale: string,
  collation: string
): CompiledTailoring {
  const source = findTailoringLocale(locale, collation)
  const key = source + '|' + collation
  const cached = getTailoring(key)
  if (cached) return cached
  const tailoring: CompiledTailoring = {
    entries: new MapConstructor(),
    suppressed: new SetConstructor(),
    backwardsSecondary: false,
  }
  applyTailoring(source, collation, tailoring, new SetConstructor())
  cacheTailoring(key, tailoring)
  return tailoring
}

function lookupTailoredElements(
  entries: TailoringEntries,
  codePoints: readonly number[],
  start: number,
  context: readonly number[],
  contextStart: number
): TailoringEntry | undefined {
  const bucket = apply(mapGet, entries, [codePoints[start]]) as
    | TailoringEntry[]
    | undefined
  let best: TailoringEntry | undefined
  if (!bucket) return best
  // Inspect later rules first so equal prefix/target mappings override earlier rules.
  // https://www.unicode.org/reports/tr35/tr35-collation.html#Context_Before
  for (let i = bucket.length - 1; i >= 0; i--) {
    const entry = bucket[i]
    if (
      (!best ||
        entry.prefix.length > best.prefix.length ||
        (entry.prefix.length === best.prefix.length &&
          entry.codePoints.length > best.codePoints.length)) &&
      matchesBefore(context, contextStart, entry.prefix) &&
      matchesAt(codePoints, start, entry.codePoints)
    )
      best = entry
  }
  return best
}

function combiningClass(point: number): number {
  if (point < 0x300) return 0
  let lo = 0
  let hi = combiningClasses.length
  while (lo < hi) {
    const mid = (lo + hi) >>> 1
    const range = combiningClasses[mid]
    if (point < range[0]) hi = mid
    else if (point > range[1]) lo = mid + 1
    else return range[2]
  }
  return 0
}

function lookupElements(
  codePoints: readonly number[],
  start: number,
  tailoring: TailoringMappings,
  context = codePoints,
  contextStart = start
) {
  return lookupRootElements(
    codePoints,
    start,
    lookupTailoredElements(
      tailoring.entries,
      codePoints,
      start,
      context,
      contextStart
    ),
    apply(setHas, tailoring.suppressed, [codePoints[start]]),
    context,
    contextStart
  )
}

function appendCollationElements(
  elements: PackedCollationElement[],
  codePoints: readonly number[],
  tailoring: TailoringMappings,
  numeric: boolean
): void {
  let runEnds: number[] | undefined
  for (let i = 0; i < codePoints.length;) {
    const digit = numeric ? decimalDigit(codePoints[i]) : -1
    if (digit >= 0) {
      i = appendNumericRun(elements, codePoints, i, digit)
      continue
    }
    let match = lookupElements(codePoints, i, tailoring)
    let end = i + match.length
    // UCA S2.1.1–3 extends a match across marks of lower combining class.
    // Retain the original prefix context and emit skipped marks after the match.
    // https://www.unicode.org/reports/tr10/#S2.1.1
    const firstClass =
      end + 1 < codePoints.length ? combiningClass(codePoints[end]) : 0
    if (firstClass) {
      const probe: number[] = []
      for (let j = i; j < end; j++) append(probe, codePoints[j])
      const firstSkipped = end
      const consumed: number[] = []
      let blockingClass = firstClass
      for (let j = end + 1; j < codePoints.length;) {
        const point = codePoints[j]
        const nextClass = combiningClass(point)
        if (!nextClass) break
        if (blockingClass < nextClass) {
          append(probe, point)
          const next = lookupElements(probe, 0, tailoring, codePoints, i)
          if (next.length === probe.length) {
            match = next
            append(consumed, j++)
            end = j
            continue
          }
          probe.length--
        }
        blockingClass = nextClass
        // Skip equal-class runs once even when several lookaheads overlap.
        const knownEnd = runEnds && ownValue(runEnds, j)
        if (knownEnd !== undefined) {
          j = knownEnd
        } else {
          let next = j + 1
          while (
            next < codePoints.length &&
            combiningClass(codePoints[next]) === nextClass
          )
            next++
          if (next > j + 1) {
            runEnds ||= []
            for (let k = j; k < next; k++) setDataProperty(runEnds, k, next)
          }
          j = next
        }
      }
      appendAll(elements, match.elements)
      if (consumed.length) {
        const skipped: number[] = []
        let consumedIndex = 0
        for (let j = firstSkipped; j < end; j++) {
          if (consumedIndex < consumed.length && j === consumed[consumedIndex])
            consumedIndex++
          else append(skipped, codePoints[j])
        }
        appendCollationElements(elements, skipped, tailoring, false)
      }
    } else {
      appendAll(elements, match.elements)
    }
    i = end
  }
}

function collationElements(
  input: string,
  tailoring: TailoringMappings,
  numeric: boolean
): PackedCollationElement[] {
  const elements: PackedCollationElement[] = []
  appendCollationElements(
    elements,
    stringToCodePoints(input),
    tailoring,
    numeric
  )
  return elements
}

function decimalDigit(point: number): number {
  if (point < 0x80) return point >= 0x30 && point <= 0x39 ? point - 0x30 : -1
  let start = 0
  let end = decimalDigitZeros.length
  while (start < end) {
    const middle = (start + end) >>> 1
    if (decimalDigitZeros[middle] <= point) start = middle + 1
    else end = middle
  }
  const digit = point - decimalDigitZeros[start - 1]
  return digit < 10 ? digit : -1
}

// ECMA-402 §10.1.1 enables LDML kn. A digit run contributes at primary
// strength, with length and significant digits ordered after the group lead.
// https://tc39.es/ecma402/#sec-initializecollator
// https://www.unicode.org/reports/tr35/tr35-collation.html#Setting_Options
function appendNumericRun(
  elements: PackedCollationElement[],
  points: readonly number[],
  index: number,
  digit: number
): number {
  const digits: number[] = []
  do {
    if (digit || digits.length) append(digits, digit)
    index++
    digit = index < points.length ? decimalDigit(points[index]) : -1
  } while (digit >= 0)
  append(elements, numericOrderingElement)
  // Payload weights are nonzero. Zero runs have no significant digits.
  append(elements, [digits.length + 1, 0, 0, 0, NUMERIC_PAYLOAD])
  for (let i = 0; i < digits.length; i++)
    append(elements, [digits[i] + 1, 0, 0, 0, NUMERIC_PAYLOAD])
  return index
}

function elementCase(element: PackedCollationElement): number {
  if (element[4] & CASE_OVERRIDE) return (element[4] >>> CASE_SHIFT) & 3
  // FractionalUCA stores root case bits in the first tertiary byte.
  // https://www.unicode.org/reports/tr35/tr35-collation.html#Case_Parameters
  let tertiary = element[2]
  while (tertiary > 0xff) tertiary >>>= 8
  return tertiary >>> 6
}

function tertiaryWeight(element: PackedCollationElement): number {
  const weight = element[2]
  if (element[4] & CASE_OVERRIDE) return weight
  let firstByte = weight
  let scale = 1
  while (firstByte > 0xff) {
    firstByte >>>= 8
    scale *= 0x100
  }
  return weight - (firstByte & 0xc0) * scale
}

function caseWeight(
  element: PackedCollationElement,
  caseFirst: IntlCollatorInternal['caseFirst']
): number {
  const bits = elementCase(element)
  return caseFirst === 'upper' ? 3 - bits : 1 + bits
}

function comparisonWeight(
  element: PackedCollationElement,
  level: number,
  slots: IntlCollatorInternal,
  reordering: readonly number[] | undefined
): number {
  // LDML Case Parameters combine case and tertiary weights for caseFirst.
  // https://www.unicode.org/reports/tr35/tr35-collation.html#Case_Parameters
  if (level === 2) {
    if (slots.sensitivity === 'case') {
      return element[0] ? caseWeight(element, slots.caseFirst) : 0
    }
    const tertiary = tertiaryWeight(element)
    if (slots.caseFirst === 'false' || !tertiary) return tertiary
    // Pure tertiary CEs stay above primary and secondary CEs in either order.
    const order =
      element[0] || element[1] ? caseWeight(element, slots.caseFirst) : 4
    return order * 0x100000000 + tertiary
  }
  if (level !== 0 || element[4] & NUMERIC_PAYLOAD) return element[level]
  const weight = primaryWeight(element)
  return reordering ? reorderPrimary(weight, reordering) : weight
}

function primaryWeight(element: PackedCollationElement): number {
  let weight = element[0]
  if (element[4] & SCALED_PRIMARY) return weight
  // Align FractionalUCA bytes, then leave space between root weights for rules.
  // https://www.unicode.org/reports/tr35/tr35-collation.html#Orderings
  while (weight > 0 && weight < 0x1000000) weight *= 0x100
  return weight * PRIMARY_SCALE
}

// UTS #10 §4 suppresses primary-ignorable elements after a shifted variable.
// ignorePunctuation also omits the variable's shifted quaternary weight.
// https://www.unicode.org/reports/tr10/#Variable_Weighting
function omitVariableWeights(elements: PackedCollationElement[]) {
  let afterVariable = false
  let length = 0
  for (let i = 0; i < elements.length; i++) {
    const element = elements[i]
    if (element[0] !== 0) afterVariable = (element[4] & VARIABLE) !== 0
    if (!afterVariable) elements[length++] = element
  }
  elements.length = length
}

function comparisonLevels(
  slots: IntlCollatorInternal,
  tertiaryStrength?: boolean
): readonly number[] {
  switch (slots.sensitivity) {
    case 'base':
      return [0]
    case 'accent':
      return [0, 1]
    case 'case':
      return [0, 2]
    default:
      return tertiaryStrength ? [0, 1, 2] : [0, 1, 2, 3]
  }
}

// LDML backwards 2 reverses secondary weights inside each U+FFFE segment.
// https://www.unicode.org/reports/tr35/tr35-collation.html#Setting_Options
// https://www.unicode.org/reports/tr10/#Backward_Accents
function backwardsSecondaryWeights(
  elements: readonly PackedCollationElement[]
): number[] {
  const weights: number[] = []
  let start = 0
  for (let end = 0; end <= elements.length; end++) {
    if (end < elements.length && !(elements[end][4] & MERGE_SEPARATOR)) continue
    for (let i = end - 1; i >= start; i--) {
      const weight = elements[i][1]
      if (weight) append(weights, weight)
    }
    // A boundary sorts before any secondary weight in its own segment.
    if (end < elements.length) append(weights, 0)
    start = end + 1
  }
  return weights
}

function compareCollationElements(
  left: readonly PackedCollationElement[],
  right: readonly PackedCollationElement[],
  slots: IntlCollatorInternal,
  tailoring: CompiledTailoring
): number {
  // UCA compares level by level after applying variable weighting.
  // https://www.unicode.org/reports/tr10/#Multi_Level_Comparison
  // https://www.unicode.org/reports/tr35/tr35-collation.html#Setting_Options
  const levels = comparisonLevels(slots, tailoring.tertiaryStrength)
  for (let i = 0; i < levels.length; i++) {
    const level = levels[i]
    if (level === 1 && tailoring.backwardsSecondary) {
      const leftWeights = backwardsSecondaryWeights(left)
      const rightWeights = backwardsSecondaryWeights(right)
      for (let j = 0; j < leftWeights.length && j < rightWeights.length; j++) {
        const result = compareNumbers(leftWeights[j], rightWeights[j])
        if (result) return result
      }
      const result = compareNumbers(leftWeights.length, rightWeights.length)
      if (result) return result
      continue
    }
    let leftIndex = 0
    let rightIndex = 0
    while (leftIndex < left.length || rightIndex < right.length) {
      let leftWeight = 0
      let rightWeight = 0
      while (!leftWeight && leftIndex < left.length) {
        leftWeight = comparisonWeight(
          left[leftIndex++],
          level,
          slots,
          tailoring.reordering
        )
      }
      while (!rightWeight && rightIndex < right.length) {
        rightWeight = comparisonWeight(
          right[rightIndex++],
          level,
          slots,
          tailoring.reordering
        )
      }
      const result = compareNumbers(leftWeight, rightWeight)
      if (result) return result
    }
  }
  return 0
}

function comparePreparedStrings(
  left: string,
  right: string,
  slots: CollatorSlots
): number {
  const tailoring = tailoringEntries(
    slots.dataLocale,
    slots.comparisonCollation
  )
  const leftElements = collationElements(left, tailoring, slots.numeric)
  const rightElements = collationElements(right, tailoring, slots.numeric)
  if (slots.ignorePunctuation) {
    omitVariableWeights(leftElements)
    omitVariableWeights(rightElements)
  }
  return compareCollationElements(leftElements, rightElements, slots, tailoring)
}

export function compareCollatorStrings(
  slots: CollatorSlots,
  x: string,
  y: string
): number {
  // CompareStrings receives already-ToString-converted values from the
  // bound compare function and returns a negative/zero/positive Number.
  // https://tc39.es/ecma402/#sec-collator-comparestrings
  // Normalize before tailoring. Sensitivity selects levels after matching.
  return comparePreparedStrings(normalize(x), normalize(y), slots)
}
