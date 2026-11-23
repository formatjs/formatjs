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

// ECMA-262 preview §22.3.13: enumerate the supported rounding modes.
// https://tc39.es/ecma262/pr/3966/#sec-rounding-modes-and-increments
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
// ECMA-262 preview §22.3.16.3 steps 2–8: lengths for the clock units in nanoseconds.
// https://tc39.es/ecma262/pr/3966/#sec-temporalunitlength
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
// Temporal comparison §13.17 step1: singular/plural unit table.
// https://tc39.es/proposal-temporal/#sec-temporal-gettemporalunitvaluedoption
// §13.17 step1: private pairs encode every normal singular/plural unit name; auto is separate.
// ECMA-262 preview §22.3.16: keep units in order with their singular and plural spellings.
// https://tc39.es/ecma262/pr/3966/#sec-temporal-units
const units = [
  ['year', 'years'],
  ['month', 'months'],
  ['week', 'weeks'],
  ['day', 'days'],
  ['hour', 'hours'],
  ['minute', 'minutes'],
  ['second', 'seconds'],
  // Preview spelling fix: https://github.com/tc39/ecma262/pull/3966#discussion_r4283713689
  ['millisecond', 'milliseconds'],
  ['microsecond', 'microseconds'],
  ['nanosecond', 'nanoseconds'],
] as const

// ECMA-262 §7.3.36 steps1–3: absent options create a null-prototype object.
// https://tc39.es/ecma262/#sec-getoptionsobject
export function optionsObject(value: unknown): Record<string, unknown> {
  if (value === undefined) return createObject(null)
  if (!IsObject(value))
    throw new TypeErrorConstructor('Options must be an object')
  return value as Record<string, unknown>
}
// Proposal comparison §8.3.9 steps4.a–4.c: private string-shorthand record.
// Other callers select their own property name; this helper performs no option reads.
export function unitOptions(
  value: string,
  key: 'smallestUnit' | 'unit' = 'smallestUnit'
): Record<string, unknown> {
  const result = createObject(null) as Record<string, unknown>
  result[key] = value
  return result
}
// Temporal comparison §14.5.2.2 steps1–4: validate the already-read rounding mode
// Caller performs Get; this kernel supplies fallback, ToString and table validation.
// https://tc39.es/proposal-temporal/#sec-temporal-getroundingmodeoption
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
// ECMA-262 preview §22.3.12.13: parse unit spelling before category validation.
// https://tc39.es/ecma262/pr/3966/#sec-gettemporalunitvaluedoption
export function unitOption(
  value: unknown,
  allowAuto = false
): string | undefined {
  if (value === undefined) return undefined
  const unit = ToString(value)
  if (allowAuto && unit === 'auto') return unit
  for (let index = 0; index < units.length; index++) {
    const pair = units[index]
    // Comparison §13.17 step9: normalize the validated spelling.
    // Step9: either exact spelling returns its canonical unit without visible string methods.
    if (unit === pair[0] || unit === pair[1]) return pair[0]
  }
  throw new RangeErrorConstructor('Invalid temporal unit')
}
// Proposal comparison §13.18 steps3/5/6: accept the time category only.
// Required-unit callers also reject unset here; §13.18 step1 is not this contract.
// ECMA-262 preview §22.3.16.4 steps 4–5: reject values outside the time group.
// https://tc39.es/ecma262/pr/3966/#sec-validatetemporalunitvalue
export function timeUnit(unit: string | undefined): TimeUnit {
  if (unit === undefined || !HasOwnProperty(timeUnitNanoseconds, unit))
    throw new RangeErrorConstructor('Expected a time unit')
  return unit as TimeUnit
}
// Temporal comparison §14.5.2.3 steps2–5: default, truncate and enforce1..1e9
// https://tc39.es/proposal-temporal/#sec-temporal-getroundingincrementoption
export function roundingIncrement(value: unknown): number {
  if (value === undefined) return 1
  const increment = mathTrunc(+(value as number))
  if (!numberIsFinite(increment) || increment < 1 || increment > 1_000_000_000)
    throw new RangeErrorConstructor('Invalid rounding increment')
  return increment
}
// Temporal comparison §13.15 steps2–7: validate the already-read fractional precision
// https://tc39.es/proposal-temporal/#sec-temporal-gettemporalfractionalseconddigitsoption
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
// Temporal comparison §13.28 steps1–16: unsigned neighbor selection.
// https://tc39.es/proposal-temporal/#sec-applyunsignedroundingmode
// Temporal comparison §13.30 steps1–6: exact-time rounding as if positive.
// https://tc39.es/proposal-temporal/#sec-temporal-roundnumbertoincrementasifpositive
// ECMA-262 preview §22.3.6.5 steps 1–2: callers supply the precomputed quantum.
// https://tc39.es/ecma262/pr/3966/#sec-roundepochnanoseconds
// Numbered steps below describe the equivalent exact quotient/remainder form.
export function roundInstant(
  value: bigint,
  quantum: bigint,
  mode: RoundingMode
): bigint {
  // §13.30 steps1/3: keep quotient as its integer part and exact remainder.
  let lower = value / quantum
  // §13.30 step3: truncating BigInt division needs correction to floor negative quotients.
  if (value < 0n && value % quantum !== 0n) lower--
  const remainder = value - lower * quantum
  // §13.28 step1: exact multiples already equal the lower neighbor.
  if (remainder === 0n) return value
  // §13.28 step2: positive quantum and nonzero remainder strictly bracket the quotient.
  // §13.28 step3: validated RoundingMode cannot be undefined.
  // §13.30 step2: exact-time rounding always selects the positive-sign table column.
  // §13.27 table22: the branches below encode all nine entries of that column.
  let up: boolean
  // §13.28 step5: infinity selects the upper neighbor.
  if (mode === 'ceil' || mode === 'expand') up = true
  // §13.28 step4: zero selects the lower neighbor.
  else if (mode === 'floor' || mode === 'trunc') up = false
  // §13.28 step6: lower distance is remainder / quantum.
  // §13.28 step7: upper distance is (quantum - remainder) / quantum.
  // §13.28 step8: twice the remainder below quantum selects the lower neighbor.
  // §13.28 step9: twice the remainder above quantum selects the upper neighbor.
  else if (2n * remainder !== quantum) up = 2n * remainder > quantum
  // §13.28 step10: the remaining case has equal distances.
  // §13.28 step11: halfFloor and halfTrunc keep the lower neighbor.
  // §13.28 step12: halfCeil and halfExpand select the upper neighbor.
  // §13.28 step13: halfEven is the only remaining tie mode.
  // §13.28 step14: adjacent quotient neighbors differ by one, so cardinality is lower modulo 2.
  // §13.28 step15: an even lower neighbor stays selected.
  // §13.28 step16: an odd lower neighbor selects its even successor.
  else
    up =
      mode === 'halfCeil' ||
      mode === 'halfExpand' ||
      (mode === 'halfEven' && lower % 2n !== 0n)
  // §13.30 step4: the upper quotient neighbor is lower + 1.
  // §13.30 step5: up selects ApplyUnsignedRoundingMode's integer result.
  // §13.30 step6: multiply that quotient by the original increment.
  return (lower + (up ? 1n : 0n)) * quantum
}
// Temporal comparison §8.3.9 steps3–18: ordered options, inclusive day divisor and exact rounding
// https://tc39.es/proposal-temporal/#sec-temporal.instant.prototype.round
export function roundInstantOptions(value: bigint, options: unknown): bigint {
  if (options === undefined)
    throw new TypeErrorConstructor('roundTo is required')
  // Comparison §8.3.9 steps4.a–4.c: private string shorthand.
  // Step4/4.a: select string shorthand and retain the primitive unit string.
  // Steps4.b–4.c: null-prototype record with its own smallestUnit data property.
  const resolved =
    typeof options === 'string' ? unitOptions(options) : optionsObject(options)
  const increment = roundingIncrement(resolved.roundingIncrement)
  const mode = roundingMode(resolved.roundingMode, 'halfExpand')
  const unit = timeUnit(unitOption(resolved.smallestUnit))
  if (import.meta.formatjsTemporalNativeData === true)
    return nativeTemporal()!.roundInstantUnit(value, unit, increment, mode)
  // Comparison §13.14 steps1.a/3–5: inclusive maximum and divisibility.
  // https://tc39.es/proposal-temporal/#sec-validatetemporalroundingincrement
  // §8.3.9 steps11–17: inclusive day divisor, bound and exact remainder.
  const maximum = 86_400_000_000_000n / timeUnitNanoseconds[unit]
  if (bigIntFrom(increment) > maximum || maximum % bigIntFrom(increment) !== 0n)
    throw new RangeErrorConstructor('Rounding increment must divide a day')
  const native = nativeTemporal()
  // Proposal comparison §8.5.7 steps1–3: form the quantum, then delegate rounding.
  return (native ? native.roundInstant : roundInstant)(
    value,
    bigIntFrom(increment) * timeUnitNanoseconds[unit],
    mode
  )
}

// Temporal comparison §13.29 steps1–9: signed increment rounding.
// https://tc39.es/proposal-temporal/#sec-temporal-roundnumbertoincrement
// Temporal comparison §13.8 steps1–5: reverse directional modes.
// https://tc39.es/proposal-temporal/#sec-temporal-negateroundingmode
// ECMA-262 preview §22.3.14.4 step 1: round a time span with the caller's unit quantum.
// https://tc39.es/ecma262/pr/3966/#sec-roundtimeduration
export function roundDuration(
  value: bigint,
  quantum: bigint,
  mode: RoundingMode
): bigint {
  // §13.29 step1: the quotient's sign matches value because quantum is positive.
  // §13.29 step2: test the sign before division; exact arithmetic makes this equivalent.
  // §13.29 step3: handle the nonnegative branch first.
  // §13.29 step3.a: its unsigned-mode column is positive.
  if (value >= 0n) return roundInstant(value, quantum, mode)
  // §13.29 step2.a: this branch implicitly carries the negative sign.
  // §13.29 step4: negating directional modes gives the negative-sign table column.
  // ECMA-262 preview §22.3.13.2: reverse directional modes for a negative sign.
  // https://tc39.es/ecma262/pr/3966/#sec-getunsignedroundingmode
  const reversed: Record<RoundingMode, RoundingMode> = {
    // §13.8 step1: ceil becomes floor.
    ceil: 'floor',
    // §13.8 step2: floor becomes ceil.
    floor: 'ceil',
    // §13.8 step5: nondirectional modes keep their identity.
    expand: 'expand',
    trunc: 'trunc',
    // §13.8 step3: halfCeil becomes halfFloor.
    halfCeil: 'halfFloor',
    // §13.8 step4: halfFloor becomes halfCeil.
    halfFloor: 'halfCeil',
    halfExpand: 'halfExpand',
    halfTrunc: 'halfTrunc',
    halfEven: 'halfEven',
  }
  // §13.29 step2.b: the inner value is the absolute numerator.
  // §13.29 step5: the shared core computes its lower quotient neighbor exactly.
  // §13.29 step6: its upper neighbor is one greater.
  // §13.29 step7: the shared core applies the selected unsigned rounding mode.
  // §13.29 step8: restore the original negative sign.
  // §13.29 step9: multiplication inside the core commutes with sign restoration.
  return -roundInstant(-value, quantum, reversed[mode])
}
