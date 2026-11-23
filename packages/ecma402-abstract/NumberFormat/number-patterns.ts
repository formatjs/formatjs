import {HasOwnProperty} from '#packages/ecma262-abstract/HasOwnProperty.js'
import {
  ErrorConstructor,
  setDataProperty,
} from '#packages/ecma262-abstract/intrinsics.js'
import type {
  CompiledNumberPatterns,
  NumberPatternPlan,
  RawNumberData,
} from '#packages/ecma402-abstract/types/number.js'

const values = <T>(data: Record<string, T>): T[] =>
  Object.keys(data).map(key => data[key])

const WeakMapConstructor = WeakMap
const MapConstructor = Map
const mapGet = Map.prototype.get
const mapSet = Map.prototype.set
const indexOf = Function.prototype.call.bind(String.prototype.indexOf) as (
  value: string,
  search: string,
  start?: number
) => number
const slice = Function.prototype.call.bind(String.prototype.slice) as (
  value: string,
  start: number,
  end?: number
) => string
const trim = Function.prototype.call.bind(String.prototype.trim) as (
  value: string
) => string
const apply = Reflect.apply
const weakMapGet = WeakMap.prototype.get
const weakMapSet = WeakMap.prototype.set
const approximateMarker = '{approximatelySign}'

// Capture methods for lazily created private pattern maps.
function readPlanCache<K extends object, V>(
  map: WeakMap<K, V>,
  key: K
): V | undefined {
  return apply(weakMapGet, map, [key])
}
function writePlanCache<K extends object, V>(
  map: WeakMap<K, V>,
  key: K,
  value: V
): void {
  apply(weakMapSet, map, [key, value])
}

const cache = new WeakMap<RawNumberData, Map<string, NumberPatternPlan[]>>()
const prepared = new WeakMap<CompiledNumberPatterns, NumberPatternPlan[]>()
const composed = new WeakMap<
  NumberPatternPlan,
  WeakMap<NumberPatternPlan, NumberPatternPlan>
>()

function approximate(pattern: string, sign: number): string {
  const index = sign === 0 ? -1 : indexOf(pattern, sign === 1 ? '+' : '-')
  return index < 0
    ? approximateMarker + pattern
    : slice(pattern, 0, index) + approximateMarker + slice(pattern, index)
}

function positiveSign(pattern: string): string {
  let result = ''
  for (let i = 0; i < pattern.length; i++) {
    const ch = pattern[i]
    result += ch === '-' ? '+' : ch
  }
  return result
}

function compactTokens(pattern: string): string {
  // Identify compact literals before inserting the approximate marker.
  let result = ''
  let literalStart = -1
  let foundZeros = false
  for (let i = 0; i < pattern.length; i++) {
    const ch = pattern[i]
    if (
      ch !== ';' &&
      ch !== '-' &&
      ch !== '+' &&
      ch !== '¤' &&
      !(ch >= '0' && ch <= '9') &&
      trim(ch) !== ''
    ) {
      if (literalStart === -1) literalStart = i
      continue
    }
    if (literalStart !== -1) {
      result += '{c:' + slice(pattern, literalStart, i) + '}'
      literalStart = -1
    }
    result += ch
    if (!foundZeros && ch === '0') {
      foundZeros = true
      while (i + 1 < pattern.length && pattern[i + 1] === '0') i++
    }
  }
  if (literalStart !== -1) result += '{c:' + slice(pattern, literalStart) + '}'
  return result
}

function isNumberSlot(ch: string): boolean {
  return ch === '#' || ch === '0'
}

function groupingSizes(
  pattern: string,
  start: number,
  end: number
): [number, number] {
  let previousComma = -1
  let lastComma = -1
  for (let i = start; i < end; i++) {
    const ch = pattern[i]
    if (ch === '.') {
      end = i
      break
    }
    if (ch === ',') {
      previousComma = lastComma
      lastComma = i
    }
  }
  const primary = lastComma === -1 ? 3 : end - lastComma - 1
  const secondary =
    previousComma === -1 ? primary : lastComma - previousComma - 1
  return [primary, secondary]
}

function numberSlots(
  pattern: string,
  compact: boolean
): {value: string; grouping: [number, number]} {
  let value = ''
  let grouping: [number, number] | undefined
  for (let i = 0; i < pattern.length;) {
    const ch = pattern[i]
    if (!isNumberSlot(ch)) {
      value += ch
      i++
      continue
    }
    let end = i + 1
    while (
      end + 1 < pattern.length &&
      (pattern[end] === '.' || pattern[end] === ',') &&
      isNumberSlot(pattern[end + 1])
    ) {
      end += 2
      while (end < pattern.length && isNumberSlot(pattern[end])) end++
    }
    grouping ??= groupingSizes(pattern, i, end)
    value += '{0}'
    i = end
  }
  if (!grouping && !compact)
    throw new ErrorConstructor('Missing number pattern: ' + pattern)
  return {value, grouping: grouping ?? [3, 3]}
}

function unquoteSingleCharacters(pattern: string): string {
  let result = ''
  for (let i = 0; i < pattern.length; i++) {
    if (
      pattern[i] === "'" &&
      i + 2 < pattern.length &&
      pattern[i + 2] === "'"
    ) {
      const ch = pattern[i + 1]
      if (ch !== '\n' && ch !== '\r' && ch !== '\u2028' && ch !== '\u2029') {
        result += ch
        i += 2
        continue
      }
    }
    result += pattern[i]
  }
  return result
}

function tokenize(value: string): NumberPatternPlan['parts'] {
  const parts: NumberPatternPlan['parts'] = []
  let start = 0
  for (let i = 0; i < value.length; i++) {
    let end = i + 1
    let token: NumberPatternPlan['parts'][number] | undefined
    switch (value[i]) {
      case '¤':
        token = ['currency', '']
        break
      case '%':
        token = ['percentSign', '']
        break
      case '+':
        token = ['plusSign', '']
        break
      case '-':
        token = ['minusSign', '']
        break
      case '{':
        if (slice(value, i, i + 3) === '{0}') {
          token = ['number', '']
          end = i + 3
        } else if (
          slice(value, i, i + approximateMarker.length) === approximateMarker
        ) {
          token = ['approximatelySign', '']
          end = i + approximateMarker.length
        } else if (slice(value, i, i + 3) === '{c:') {
          const close = indexOf(value, '}', i + 3)
          if (close > i + 3) {
            token = ['compact', slice(value, i + 3, close)]
            end = close + 1
          }
        }
    }
    if (token) {
      if (start < i)
        setDataProperty(parts, parts.length, [
          'literal',
          slice(value, start, i),
        ])
      setDataProperty(parts, parts.length, token)
      start = end
      i = end - 1
    }
  }
  if (start < value.length)
    setDataProperty(parts, parts.length, ['literal', slice(value, start)])
  return parts
}

// ECMA-402 §§16.5.10–11 select private locale patterns. Older packs are
// decoded on demand without running RegExp or consulting public methods.
// https://tc39.es/ecma402/#sec-getnumberformatpattern
// https://unicode.org/reports/tr35/tr35-numbers.html#Number_Patterns
function compile(pattern: string, compact: boolean): NumberPatternPlan[] {
  const delimiter = indexOf(pattern, ';')
  const positive = delimiter < 0 ? pattern : slice(pattern, 0, delimiter)
  const next = delimiter < 0 ? -1 : indexOf(pattern, ';', delimiter + 1)
  const negative =
    delimiter < 0
      ? '-' + pattern
      : slice(pattern, delimiter + 1, next < 0 ? pattern.length : next)
  const minus = indexOf(negative, '-')
  const signed = [
    positive,
    negative,
    minus < 0 ? '+' + positive : positiveSign(negative),
  ]
  const plans: NumberPatternPlan[] = []
  for (let i = 0; i < 6; i++) {
    const signIndex = i % 3
    let value = signed[signIndex]
    if (compact) value = compactTokens(value)
    if (i >= 3) {
      value =
        i === 3 && minus >= 0 && !compact
          ? slice(negative, 0, minus) +
            approximateMarker +
            slice(negative, minus + 1)
          : approximate(value, signIndex === 0 ? 0 : signIndex === 1 ? -1 : 1)
    }
    const {value: withSlots, grouping} = numberSlots(value, compact)
    setDataProperty(plans, i, {
      grouping,
      parts: tokenize(unquoteSingleCharacters(withSlots)),
    })
  }
  return plans
}

/** Shared wire schema. Identical sign plans and numbering-system aliases share IDs. */
export function compileNumberPatterns(
  data: RawNumberData
): CompiledNumberPatterns {
  const result: CompiledNumberPatterns = {
    version: 1,
    standard: {},
    compact: {},
    plans: [],
    tokens: [],
  }
  const ids = new Map<string, number>()
  const tokens = new Map<string, number>()
  const add = (pattern: string, compact = false) => {
    const table = compact ? result.compact : result.standard
    if (HasOwnProperty(table, pattern)) return
    table[pattern] = compile(pattern, compact).map(plan => {
      const key = JSON.stringify(plan)
      let id = ids.get(key)
      if (id === undefined) {
        id = result.plans.length
        ids.set(key, id)
        result.plans.push([
          ...plan.grouping,
          ...plan.parts.map(token => {
            const key = JSON.stringify(token)
            let id = tokens.get(key)
            if (id === undefined) {
              id = result.tokens.length
              tokens.set(key, id)
              result.tokens.push(token)
            }
            return id
          }),
        ])
      }
      return id
    })
  }
  const compact = (
    patterns: RawNumberData['decimal'][string]['short'] | undefined
  ) => {
    for (const rules of values(patterns || {}))
      for (const pattern of values(rules))
        if (pattern && pattern !== '0') add(pattern, true)
  }
  for (const value of values(data.decimal)) {
    add(value.standard)
    compact(value.short)
    compact(value.long)
  }
  for (const value of values(data.percent)) add(value)
  for (const value of values(data.currency)) {
    add(value.standard)
    add(value.accounting)
  }
  return result
}

// ECMA-402 §16.5.10 steps 1–9 select stored pattern data without public hooks.
// https://tc39.es/ecma402/#sec-getnumberformatpattern
export function getNumberPattern(
  data: RawNumberData,
  pattern: string,
  compact: boolean,
  sign: number,
  approximately: boolean
): NumberPatternPlan {
  const index = (sign === 0 ? 0 : sign === -1 ? 1 : 2) + (approximately ? 3 : 0)
  const generated = HasOwnProperty(data, 'patternPlans')
    ? data.patternPlans
    : undefined
  if (generated?.version === 1) {
    const table = compact ? generated.compact : generated.standard
    if (HasOwnProperty(table, pattern)) {
      let plans = readPlanCache(prepared, generated)
      if (!plans) {
        plans = []
        writePlanCache(prepared, generated, plans)
      }
      const id = table[pattern][index]
      if (!HasOwnProperty(plans, `${id}`)) {
        const plan = generated.plans[id]
        const parts: NumberPatternPlan['parts'] = []
        for (let i = 2; i < plan.length; i++)
          setDataProperty(parts, i - 2, generated.tokens[plan[i]])
        setDataProperty(plans, id, {
          grouping: [plan[0], plan[1]],
          parts,
        })
      }
      return plans[id]
    }
  }
  let patterns = readPlanCache(cache, data)
  if (!patterns) {
    patterns = new MapConstructor()
    writePlanCache(cache, data, patterns)
  }
  const key = `${compact ? 'compact' : 'standard'}:${pattern}`
  let plans = apply(mapGet, patterns, [key]) as NumberPatternPlan[] | undefined
  if (!plans) {
    plans = compile(pattern, compact)
    apply(mapSet, patterns, [key, plans])
  }
  return plans[index]
}

/** Style owns signs and affixes; notation only fills its number slot. */
export function composeNumberPattern(
  style: NumberPatternPlan,
  notation: NumberPatternPlan
): NumberPatternPlan {
  let patterns = readPlanCache(composed, style)
  if (!patterns) {
    patterns = new WeakMapConstructor()
    writePlanCache(composed, style, patterns)
  }
  let result = readPlanCache(patterns, notation)
  if (!result) {
    result = {
      grouping: style.grouping,
      parts: [],
    }
    for (let i = 0; i < style.parts.length; i++) {
      const part = style.parts[i]
      if (part[0] === 'number') {
        for (let j = 0; j < notation.parts.length; j++)
          setDataProperty(result.parts, result.parts.length, notation.parts[j])
      } else {
        setDataProperty(result.parts, result.parts.length, part)
      }
    }
    writePlanCache(patterns, notation, result)
  }
  return result
}
