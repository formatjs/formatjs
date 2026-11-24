import {invariant} from '#packages/ecma402-abstract/utils.js'
import type {
  DecimalFormatNum,
  LDMLPluralRuleMap,
} from '#packages/ecma402-abstract/types/number.js'

type Patterns = Record<DecimalFormatNum, LDMLPluralRuleMap<string>>
interface Entry {
  rules: LDMLPluralRuleMap<string>
  exponent: number
}
interface Index {
  maximum: number
  entries: Map<number, Entry>
}
const indexes = new WeakMap<Patterns, Index>()
const readIndex = indexes.get.bind(indexes)
const storeIndex = indexes.set.bind(indexes)
const deleteIndex = indexes.delete.bind(indexes)
const createEntries = Map
const apply = Reflect.apply
const readEntry = Map.prototype.get
const storeEntry = Map.prototype.set
const keys = Object.keys
const indexOf = String.prototype.indexOf

function prepareCompactPatterns(patterns: Patterns): void {
  const entries = new createEntries<number, Entry>()
  let maximum = -1
  const thresholds = keys(patterns) as DecimalFormatNum[]
  for (let i = 0; i < thresholds.length; i++) {
    const key = thresholds[i]
    invariant(key[0] === '1', 'Invalid compact magnitude')
    for (let digit = 1; digit < key.length; digit++)
      invariant(key[digit] === '0', 'Invalid compact magnitude')
    const magnitude = key.length - 1
    const rules = patterns[key]
    const pattern = rules.other
    const start = apply(indexOf, pattern, ['0']) as number
    let end = start
    while (end >= 0 && end < pattern.length && pattern[end] === '0') end++
    // UTS #35 compact formatting counts zero placeholders in the matching pattern.
    // https://unicode.org/reports/tr35/tr35-numbers.html#Compact_Number_Formats
    apply(storeEntry, entries, [
      magnitude,
      {
        rules,
        exponent:
          pattern === '0' ? 0 : magnitude + 1 - (start < 0 ? 1 : end - start),
      },
    ])
    if (magnitude > maximum) maximum = magnitude
  }
  storeIndex(patterns, {maximum, entries})
}

export function invalidateCompactPatterns(patterns: Patterns): void {
  deleteIndex(patterns)
}

export function getCompactPattern(
  patterns: Patterns | undefined,
  magnitude: number
): Entry | undefined {
  if (!patterns || magnitude < 0) return undefined
  let index = readIndex(patterns)
  if (!index) {
    prepareCompactPatterns(patterns)
    index = readIndex(patterns)!
  }
  return apply(readEntry, index.entries, [
    magnitude < index.maximum ? magnitude : index.maximum,
  ])
}
