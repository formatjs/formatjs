import {HasOwnProperty} from '#packages/ecma262-abstract/HasOwnProperty.js'
import {
  RangeErrorConstructor,
  TypeErrorConstructor,
  arrayIncludes,
  bigIntFrom,
  floor,
  mathTrunc,
  numberIsFinite,
} from '#packages/ecma262-abstract/intrinsics.js'
import {IsObject} from '#packages/ecma262-abstract/IsObject.js'
import {createObject} from '#packages/temporal/intrinsics.js'
import {ToString} from '#packages/ecma262-abstract/ToString.js'
import {nativeTemporal} from '#packages/temporal/native.js'

export type RoundingMode =
  | 'ceil'
  | 'floor'
  | 'expand'
  | 'trunc'
  | 'halfCeil'
  | 'halfFloor'
  | 'halfExpand'
  | 'halfTrunc'
  | 'halfEven'
export type TimeUnit =
  | 'hour'
  | 'minute'
  | 'second'
  | 'millisecond'
  | 'microsecond'
  | 'nanosecond'
export type Precision = 'auto' | 'minute' | number
export const timeUnitNanoseconds: Record<TimeUnit, bigint> = {
  hour: 3_600_000_000_000n,
  minute: 60_000_000_000n,
  second: 1_000_000_000n,
  millisecond: 1_000_000n,
  microsecond: 1000n,
  nanosecond: 1n,
}
const modes = [
  'ceil',
  'floor',
  'expand',
  'trunc',
  'halfCeil',
  'halfFloor',
  'halfExpand',
  'halfTrunc',
  'halfEven',
]
// https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/abstractops.html#L549
// L549: private pairs encode every normal singular/plural unit name; auto is separate.
const units = [
  ['year', 'years'],
  ['month', 'months'],
  ['week', 'weeks'],
  ['day', 'days'],
  ['hour', 'hours'],
  ['minute', 'minutes'],
  ['second', 'seconds'],
  ['millisecond', 'milliseconds'],
  ['microsecond', 'microseconds'],
  ['nanosecond', 'nanoseconds'],
] as const

export function optionsObject(value: unknown): Record<string, unknown> {
  if (value === undefined) return createObject(null)
  if (!IsObject(value))
    throw new TypeErrorConstructor('Options must be an object')
  return value as Record<string, unknown>
}
// String shorthand creates a private null-prototype record with one own data property.
export function unitOptions(
  value: string,
  key: 'smallestUnit' | 'unit' = 'smallestUnit'
): Record<string, unknown> {
  const result = createObject(null) as Record<string, unknown>
  result[key] = value
  return result
}
export function roundingMode(
  value: unknown,
  fallback: RoundingMode
): RoundingMode {
  if (value === undefined) return fallback
  const mode = ToString(value)
  if (!arrayIncludes(modes, mode))
    throw new RangeErrorConstructor('Invalid rounding mode')
  return mode as RoundingMode
}
export function unitOption(value: unknown): string | undefined {
  if (value === undefined) return undefined
  const unit = ToString(value)
  for (let index = 0; index < units.length; index++) {
    const pair = units[index]
    // https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/abstractops.html#L559
    // L559: either exact spelling returns its canonical unit without visible string methods.
    if (unit === pair[0] || unit === pair[1]) return pair[0]
  }
  throw new RangeErrorConstructor('Invalid temporal unit')
}
export function timeUnit(unit: string | undefined): TimeUnit {
  if (unit === undefined || !HasOwnProperty(timeUnitNanoseconds, unit))
    throw new RangeErrorConstructor('Expected a time unit')
  return unit as TimeUnit
}
export function roundingIncrement(value: unknown): number {
  if (value === undefined) return 1
  const increment = mathTrunc(+(value as number))
  if (!numberIsFinite(increment) || increment < 1 || increment > 1_000_000_000)
    throw new RangeErrorConstructor('Invalid rounding increment')
  return increment
}
export function fractionalSecondDigits(value: unknown): 'auto' | number {
  if (value === undefined) return 'auto'
  if (typeof value === 'number') {
    const digits = floor(value)
    if (!numberIsFinite(digits) || digits < 0 || digits > 9)
      throw new RangeErrorConstructor('Invalid fractionalSecondDigits')
    return digits
  }
  if (ToString(value) !== 'auto')
    throw new RangeErrorConstructor('Invalid fractionalSecondDigits')
  return 'auto'
}

// Exact integer arithmetic for these pinned algorithms; caller validation stays separate.
// https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/abstractops.html#L932-L947
// https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/abstractops.html#L996-L1001
// Spec line tags below refer to this pinned abstractops.html.
export function roundInstant(
  value: bigint,
  quantum: bigint,
  mode: RoundingMode
): bigint {
  // L996: keep quotient as its integer part and exact remainder.
  let lower = value / quantum
  // L998: truncating BigInt division needs correction to floor negative quotients.
  if (value < 0n && value % quantum !== 0n) lower--
  const remainder = value - lower * quantum
  // L932: exact multiples already equal the lower neighbor.
  if (remainder === 0n) return value
  // L933: positive quantum and nonzero remainder strictly bracket the quotient.
  // L934: validated RoundingMode cannot be undefined.
  // L997: exact-time rounding always selects the positive-sign table column.
  // L819: the branches below encode all nine entries of that column.
  let up: boolean
  // L936: infinity selects the upper neighbor.
  if (mode === 'ceil' || mode === 'expand') up = true
  // L935: zero selects the lower neighbor.
  else if (mode === 'floor' || mode === 'trunc') up = false
  // L937: lower distance is remainder / quantum.
  // L938: upper distance is (quantum - remainder) / quantum.
  // L939: twice the remainder below quantum selects the lower neighbor.
  // L940: twice the remainder above quantum selects the upper neighbor.
  else if (2n * remainder !== quantum) up = 2n * remainder > quantum
  // L941: the remaining case has equal distances.
  // L942: halfFloor and halfTrunc keep the lower neighbor.
  // L943: halfCeil and halfExpand select the upper neighbor.
  // L944: halfEven is the only remaining tie mode.
  // L945: adjacent quotient neighbors differ by one, so cardinality is lower modulo 2.
  // L946: an even lower neighbor stays selected.
  // L947: an odd lower neighbor selects its even successor.
  else
    up =
      mode === 'halfCeil' ||
      mode === 'halfExpand' ||
      (mode === 'halfEven' && lower % 2n !== 0n)
  // L999: the upper quotient neighbor is lower + 1.
  // L1000: up selects ApplyUnsignedRoundingMode's integer result.
  // L1001: multiply that quotient by the original increment.
  return (lower + (up ? 1n : 0n)) * quantum
}
export function roundInstantOptions(value: bigint, options: unknown): bigint {
  if (options === undefined)
    throw new TypeErrorConstructor('roundTo is required')
  // https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/instant.html#L186-L189
  // L186: select string shorthand; L187: retain the primitive unit string.
  // L188: create a null-prototype record; L189: create its own smallestUnit data property.
  const resolved =
    typeof options === 'string' ? unitOptions(options) : optionsObject(options)
  const increment = roundingIncrement(resolved.roundingIncrement)
  const mode = roundingMode(resolved.roundingMode, 'halfExpand')
  const unit = timeUnit(unitOption(resolved.smallestUnit))
  if (import.meta.formatjsTemporalNativeData === true)
    return nativeTemporal()!.roundInstantUnit(value, unit, increment, mode)
  const maximum = 86_400_000_000_000n / timeUnitNanoseconds[unit]
  if (bigIntFrom(increment) > maximum || maximum % bigIntFrom(increment) !== 0n)
    throw new RangeErrorConstructor('Rounding increment must divide a day')
  const native = nativeTemporal()
  return (native ? native.roundInstant : roundInstant)(
    value,
    bigIntFrom(increment) * timeUnitNanoseconds[unit],
    mode
  )
}

// https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/abstractops.html#L964-L975
// https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/abstractops.html#L300-L304
export function roundDuration(
  value: bigint,
  quantum: bigint,
  mode: RoundingMode
): bigint {
  // L964: the quotient's sign matches value because quantum is positive.
  // L965: test the sign before division; exact arithmetic makes this equivalent.
  // L968: handle the nonnegative branch first.
  // L969: its unsigned-mode column is positive.
  if (value >= 0n) return roundInstant(value, quantum, mode)
  // L966: this branch implicitly carries the negative sign.
  // L970: negating directional modes gives the negative-sign table column.
  const reversed: Record<RoundingMode, RoundingMode> = {
    // L300: ceil becomes floor.
    ceil: 'floor',
    // L301: floor becomes ceil.
    floor: 'ceil',
    // L304: nondirectional modes keep their identity.
    expand: 'expand',
    trunc: 'trunc',
    // L302: halfCeil becomes halfFloor.
    halfCeil: 'halfFloor',
    // L303: halfFloor becomes halfCeil.
    halfFloor: 'halfCeil',
    halfExpand: 'halfExpand',
    halfTrunc: 'halfTrunc',
    halfEven: 'halfEven',
  }
  // L967: the inner value is the absolute numerator.
  // L971: the shared core computes its lower quotient neighbor exactly.
  // L972: its upper neighbor is one greater.
  // L973: the shared core applies the selected unsigned rounding mode.
  // L974: restore the original negative sign.
  // L975: multiplication inside the core commutes with sign restoration.
  return -roundInstant(-value, quantum, reversed[mode])
}
