import minimist from 'minimist'
import {readFileSync} from 'node:fs'
import {outputFileSync} from 'fs-extra/esm'
import decompositionMappings from '@unicode/unicode-17.0.0/Decomposition_Mapping/Canonical/code-points.mjs'
import decimalDigits from '@unicode/unicode-17.0.0/General_Category/Decimal_Number/code-points.mjs'
import {
  buildUCATrie,
  parseUCA,
  parseUCALine,
  parseCollationElement,
  parseUCAVariableTop,
  isUCAVariableWeight,
  type PackedTrieNode,
  type ParsedUCAEntry,
} from './parse-uca.js'

type PackedElement = readonly [
  primary: number,
  secondary: number,
  tertiary: number,
  quaternary: number,
  flags: number,
]

type PackedPrefixEntry = {
  readonly prefix: readonly number[]
  readonly codePoints: readonly number[]
  readonly elements: readonly PackedElement[]
}

function packElement(
  entry: ParsedUCAEntry,
  variableTop: number | undefined
): PackedElement[] {
  // Mark variable weights and the non-variable U+FFFE merge separator.
  // https://www.unicode.org/reports/tr10/#Multi_Level_Comparison
  // https://www.unicode.org/reports/tr10/#Variable_Weighting
  const mergeSeparator =
    entry.codePoints.length === 1 && entry.codePoints[0] === 0xfffe
  return entry.elements.map(element => [
    element.primary,
    element.secondary,
    element.tertiary,
    element.quaternary,
    mergeSeparator
      ? 8
      : element.variable ||
          (variableTop !== undefined &&
            isUCAVariableWeight(element.primary, variableTop))
        ? 1
        : 0,
  ])
}

function countTrieNodes(node: PackedTrieNode): number {
  let count = 1
  if (node.next) {
    for (const key of Object.keys(node.next)) {
      count += countTrieNodes(node.next[Number(key)])
    }
  }
  return count
}

function serialize(value: unknown): string {
  // Keep large numeric tables out of the JavaScript parser during startup.
  return `JSON.parse(${JSON.stringify(JSON.stringify(value))})`
}

function fullDecomposition(point: number): number[] {
  const mapping = decompositionMappings.get(point)
  return mapping ? mapping.flatMap(fullDecomposition) : [point]
}

function hanImplicitWeights(source: string) {
  // CLDR radical-stroke order is needed by the unihan tailorings. Use the
  // ranges from this same FractionalUCA release for membership and indexing.
  // https://www.unicode.org/reports/tr35/tr35-collation.html#FractionalUCA
  const membership = /^\[Unified_Ideograph ([^\]]+)\]/m.exec(source)
  const marker = /^FDD1 [^;\r\n]+;[^\r\n]+# HAN first primary[^\r\n]*/m.exec(
    source
  )
  const first = marker && parseUCALine(marker[0])?.elements[0].primary
  if (!membership || !first)
    throw new Error('Missing FractionalUCA Han metadata')
  let start = first
  while (start < 0x1000000) start *= 0x100
  // Large CJK tailorings insert their primary chains before implicit Han.
  const implicitStart = start + 0x20000
  // Leave space between root primaries for LDML tailoring relations.
  const step = 0x2000
  const weights = new Map<number, number>()
  for (const [, group] of source.matchAll(
    /^\[radical [^:\r\n]+:([^\]\r\n]+)\]/gm
  )) {
    for (const [, character, last] of group.matchAll(/([^-])(?:-([^-]))?/gu)) {
      const begin = character.codePointAt(0)!
      const end = last?.codePointAt(0) ?? begin
      for (let point = begin; point <= end; point++) {
        if (weights.has(point))
          throw new Error(`Duplicate Han code point ${point}`)
        weights.set(point, implicitStart + (weights.size + 1) * step)
      }
    }
  }
  const ranks: number[] = []
  const ranges = membership[1]
    .split(/\s+/)
    .map(range => {
      const [begin, end = begin] = range
        .split('..')
        .map(value => parseInt(value, 16))
      return [begin, end + 1] as const
    })
    .sort(([a], [b]) => a - b)
    .map(([begin, end]) => {
      const offset = ranks.length
      for (let point = begin; point < end; point++) {
        const weight = weights.get(point)
        if (weight === undefined)
          throw new Error(`Missing Han code point ${point}`)
        ranks.push((weight - implicitStart) / step)
      }
      return [begin, end, offset]
    })
  if (!weights.size || weights.size !== ranks.length) {
    throw new Error('Mismatched FractionalUCA Han membership and order')
  }
  return {start, implicitStart, step, ranks, ranges, weights}
}

function primaryReordering(source: string, entries: readonly ParsedUCAEntry[]) {
  const scriptsByByte = new Map<number, string[]>()
  let trailing = 0
  for (const [, byte, tokens] of source.matchAll(
    /^\[top_byte\s+(\w+)\s+([^\]]+)\]/gm
  )) {
    const primaryByte = parseInt(byte, 16)
    const names = tokens.trim().split(/\s+/)
    if (names[0] === 'TRAILING' && !trailing) trailing = primaryByte * 0x1000000
    scriptsByByte.set(
      primaryByte,
      names.filter(name => /^[A-Z][a-z]{3}$/.test(name))
    )
  }
  const starts: number[] = []
  const codes: Record<string, number> = Object.create(null)
  const regexes = new Map<string, RegExp | undefined>()
  const core = new Map([
    [0x00a0, 'space'],
    [0x201c, 'punct'],
    [0x263a, 'symbol'],
    [0x20ac, 'currency'],
    [0x0034, 'digit'],
    [0xfdd0, 'unassigned'],
  ])
  // LDML Script Reordering uses FractionalUCA's FDD1 boundary markers.
  // Multiple scripts can share an exact boundary even when lead bytes overlap.
  // https://www.unicode.org/reports/tr35/tr35-collation.html#Script_Reordering
  const markers = new Map<number, Set<string>>()
  for (const {codePoints, elements} of entries) {
    if (
      codePoints.length !== 2 ||
      codePoints[0] !== 0xfdd1 ||
      elements.length !== 1
    )
      continue
    let weight = elements[0].primary
    if (!weight) continue
    while (weight < 0x1000000) weight *= 0x100
    const marker = codePoints[1]
    const names = markers.get(weight) ?? new Set<string>()
    markers.set(weight, names)
    const coreCode = core.get(marker)
    if (coreCode) {
      names.add(coreCode)
      continue
    }
    const sample = String.fromCodePoint(marker)
    for (const script of scriptsByByte.get(weight >>> 24) ?? []) {
      if (!regexes.has(script)) {
        try {
          regexes.set(script, new RegExp(`^\\p{Script=${script}}$`, 'u'))
        } catch {
          // A pinned script can be newer than the generator's JavaScript engine.
          // Its boundary still participates in the root order.
          regexes.set(script, undefined)
        }
      }
      if (regexes.get(script)?.test(sample)) names.add(script)
    }
  }
  for (const [weight, names] of [...markers].sort(([a], [b]) => a - b)) {
    for (const name of names) codes[name] = starts.length
    starts.push(weight)
  }
  if (
    !trailing ||
    [...core.values(), 'Hani'].some(code => codes[code] === undefined)
  ) {
    throw new Error('Missing FractionalUCA reordering boundaries')
  }
  return {starts, codes, trailing}
}

const argv = minimist(process.argv.slice(2), {
  string: ['ucaPath', 'combiningClassPath', 'out'],
})

if (!argv.ucaPath) {
  throw new Error('--ucaPath is required')
}
if (!argv.out) {
  throw new Error('--out is required')
}
if (!argv.combiningClassPath) {
  throw new Error('--combiningClassPath is required')
}

const source = readFileSync(argv.ucaPath, 'utf8')
// Only nonzero canonical combining classes participate in lookahead.
// https://www.unicode.org/reports/tr10/#S2.1.2
const combiningClasses = Array.from(
  readFileSync(argv.combiningClassPath, 'utf8').matchAll(
    /^([0-9A-F]+)(?:\.\.([0-9A-F]+))?\s*;\s*([1-9][0-9]*)\b/gm
  ),
  ([, first, last, ccc]) => [
    parseInt(first, 16),
    parseInt(last || first, 16),
    Number(ccc),
  ]
).sort(([a], [b]) => a - b)
if (!combiningClasses.length)
  throw new Error('Missing canonical combining classes')
// UAX #15 §1.3 recursively applies canonical mappings before ordering marks.
// https://www.unicode.org/reports/tr15/#Description_Norm
const canonicalDecompositions: Record<number, number[]> = {}
for (const point of decompositionMappings.keys()) {
  // Unicode §3.12.2 decomposes Hangul arithmetically at runtime.
  if (point < 0xac00 || point > 0xd7a3)
    canonicalDecompositions[point] = fullDecomposition(point)
}
const han = hanImplicitWeights(source)
const entries = parseUCA(source, point => {
  const primary = han.weights.get(point)
  if (primary !== undefined) {
    return {primary, secondary: 5, tertiary: 5, quaternary: 0, variable: false}
  }
})
const variableTop = parseUCAVariableTop(source)
const reordering = primaryReordering(source, entries)
const hanGroup = reordering.codes.Hani
if (
  han.start !== reordering.starts[hanGroup] ||
  han.implicitStart + han.step * han.ranks.length >=
    reordering.starts[hanGroup + 1] ||
  reordering.starts[reordering.codes.unassigned] + 0x110000 >=
    reordering.trailing
) {
  throw new Error('Implicit weights exceed their FractionalUCA group')
}
// Logical resets anchor one CE. "Last regular" is the Hani boundary.
// https://www.unicode.org/reports/tr35/tr35-collation.html#Logical_Reset_Positions
const logicalResets: Record<string, PackedElement> = Object.create(null)
for (const [, position, raw] of source.matchAll(
  /^\[((?:first|last) (?:tertiary ignorable|secondary ignorable|primary ignorable|variable|regular|implicit|trailing))\s+\[([^\]]+)\]\]/gm
)) {
  const {primary, secondary, tertiary, quaternary} = parseCollationElement(raw)
  logicalResets[`[${position}]`] = [
    primary,
    secondary,
    tertiary,
    quaternary,
    Number(
      variableTop !== undefined && isUCAVariableWeight(primary, variableTop)
    ),
  ]
}
logicalResets['[last regular]'] = [han.start, 5, 5, 0, 0]
logicalResets['[first implicit]'] = [han.implicitStart + han.step, 5, 5, 0, 0]
logicalResets['[last implicit]'] = [
  reordering.starts[reordering.codes.unassigned] + 0x110000,
  5,
  5,
  0,
  0,
]
// CLDR FractionalUCA uses FDD0 0034 to mark the numeric digit-group lead.
// https://www.unicode.org/reports/tr35/tr35-collation.html#FractionalUCA
const numericMarker = entries.find(
  entry =>
    entry.prefix === undefined &&
    entry.codePoints.length === 2 &&
    entry.codePoints[0] === 0xfdd0 &&
    entry.codePoints[1] === 0x34
)
if (!numericMarker || numericMarker.elements.length !== 1) {
  throw new Error('Missing FractionalUCA numeric ordering weight')
}
const [numericOrderingElement] = packElement(numericMarker, variableTop)
// UCA root mappings without prefixes go into the longest-match trie; prefixed
// mappings are emitted separately for context-sensitive lookup.
// https://www.unicode.org/reports/tr10/#Contractions
// https://www.unicode.org/reports/tr10/#Contextual_Sensitive_Mappings
const rootEntries = entries.filter(
  entry => entry.prefix === undefined && entry !== numericMarker
)
const prefixEntries = entries.filter(
  (entry): entry is ParsedUCAEntry & {prefix: number[]} =>
    entry.prefix !== undefined
)
const rootTrie = buildUCATrie(rootEntries)
const rootElements = rootEntries.map(entry => packElement(entry, variableTop))
const rootPrefixEntries: PackedPrefixEntry[] = prefixEntries.map(entry => ({
  prefix: entry.prefix,
  codePoints: entry.codePoints,
  elements: packElement(entry, variableTop),
}))
// Unicode Decimal_Number sets encode 0–9 in code point order.
// https://www.unicode.org/reports/tr44/#Numeric_Type
const decimalDigitZeros = decimalDigits.filter((_, index) => index % 10 === 0)
if (
  decimalDigits.length % 10 ||
  decimalDigits.some(
    (point, index) =>
      point !== decimalDigitZeros[Math.floor(index / 10)] + (index % 10)
  )
) {
  throw new Error('Unexpected Unicode decimal digit sequence')
}

outputFileSync(
  argv.out,
  `// @generated by packages/intl-collator/scripts/generate-root-data.ts
// CLDR root collation data generated from FractionalUCA_SHORT.txt.

export type PackedCollationElement = readonly [
  primary: number,
  secondary: number,
  tertiary: number,
  quaternary: number,
  flags: number,
]

export type PackedTrieNode = {
  value?: number
  next?: Record<number, PackedTrieNode>
}

export type PackedPrefixEntry = {
  readonly prefix: readonly number[]
  readonly codePoints: readonly number[]
  readonly elements: readonly PackedCollationElement[]
}

export const rootTrie: PackedTrieNode = ${serialize(rootTrie)}

export const rootElements: readonly (readonly PackedCollationElement[])[] = ${serialize(rootElements)}

export const rootPrefixEntries: readonly PackedPrefixEntry[] = ${serialize(rootPrefixEntries)}
export const combiningClasses: readonly (readonly [number, number, number])[] = ${JSON.stringify(combiningClasses)}
export const canonicalDecompositionJSON = ${JSON.stringify(JSON.stringify(canonicalDecompositions))}

export const decimalDigitZeros: readonly number[] = ${JSON.stringify(decimalDigitZeros)}
export const numericOrderingElement: PackedCollationElement = ${JSON.stringify(numericOrderingElement)}
export const primaryReordering: {starts: readonly number[]; codes: Readonly<Record<string, number>>; trailing: number} = ${JSON.stringify(reordering)}
export const hanRanges: readonly (readonly [number, number, number])[] = ${JSON.stringify(han.ranges)}
export const hanRanks: readonly number[] = ${serialize(han.ranks)}
export const hanImplicitStart = ${han.implicitStart}
export const hanWeightStep = ${han.step}
export const rootLogicalResets: Readonly<Record<string, PackedCollationElement>> = ${JSON.stringify(logicalResets)}

export const rootDataStats = {
  entries: ${rootEntries.length},
  prefixEntries: ${prefixEntries.length},
  trieNodes: ${countTrieNodes(rootTrie)},
  variableTop: ${variableTop ?? 'undefined'},
} as const
`
)
