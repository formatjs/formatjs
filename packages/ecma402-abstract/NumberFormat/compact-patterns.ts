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

function prepareCompactPatterns(patterns: Patterns): void {
  const entries = new Map<number, Entry>()
  let maximum = -1
  for (const key of Object.keys(patterns) as DecimalFormatNum[]) {
    invariant(/^10*$/.test(key), 'Invalid compact magnitude')
    const magnitude = key.length - 1
    const rules = patterns[key]
    const zeros = rules.other.match(/0+/)
    invariant(zeros, 'Missing compact number slot')
    entries.set(magnitude, {
      rules,
      exponent: rules.other === '0' ? 0 : magnitude + 1 - zeros[0].length,
    })
    maximum = Math.max(maximum, magnitude)
  }
  indexes.set(patterns, {maximum, entries})
}

export function invalidateCompactPatterns(patterns: Patterns): void {
  indexes.delete(patterns)
}

export function getCompactPattern(
  patterns: Patterns | undefined,
  magnitude: number
): Entry | undefined {
  if (!patterns || magnitude < 0) return undefined
  if (!indexes.has(patterns)) prepareCompactPatterns(patterns)
  const index = indexes.get(patterns)!
  return index.entries.get(Math.min(magnitude, index.maximum))
}
