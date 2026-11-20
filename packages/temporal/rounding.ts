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
const units = [
  'year',
  'month',
  'week',
  'day',
  'hour',
  'minute',
  'second',
  'millisecond',
  'microsecond',
  'nanosecond',
]
export function optionsObject(value: unknown): Record<string, unknown> {
  if (value === undefined) return Object.create(null)
  if (
    value === null ||
    (typeof value !== 'object' && typeof value !== 'function')
  )
    throw new TypeError('Options must be an object')
  return value as Record<string, unknown>
}
export function roundingMode(
  value: unknown,
  fallback: RoundingMode
): RoundingMode {
  // https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/mainadditions.html#L180-L183
  // L180: modes contains the table's nine string identifiers.
  // L181: our enum values already use the corresponding strings.
  // L182: the caller reads the property once; undefined selects fallback.
  if (value === undefined) return fallback
  const mode = ToString(value)
  if (!modes.includes(mode)) throw new RangeError('Invalid rounding mode')
  // L183: the validated string is also the internal mode.
  return mode as RoundingMode
}
export function unitOption(value: unknown): string | undefined {
  if (value === undefined) return undefined
  let unit = ToString(value)
  if (unit.endsWith('s')) unit = unit.slice(0, -1)
  if (!units.includes(unit)) throw new RangeError('Invalid temporal unit')
  return unit
}
export function timeUnit(unit: string | undefined): TimeUnit {
  if (unit === undefined || !Object.hasOwn(timeUnitNanoseconds, unit))
    throw new RangeError('Expected a time unit')
  return unit as TimeUnit
}
export function roundingIncrement(value: unknown): number {
  // https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/mainadditions.html#L319-L323
  // L319: the caller reads roundingIncrement before entering this helper.
  // L320: only undefined selects 1.
  if (value === undefined) return 1
  // L321: unary plus implements ToNumber (including throwing for BigInt).
  const increment = Math.trunc(+(value as number))
  // L322: the truncated integer must be in [1, 10^9]; reject nonfinite inputs too.
  if (!Number.isFinite(increment) || increment < 1 || increment > 1_000_000_000)
    throw new RangeError('Invalid rounding increment')
  // L323: keep the truncated value.
  return increment
}
export function fractionalSecondDigits(value: unknown): 'auto' | number {
  // https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/abstractops.html#L452-L460
  // L452: the caller already read fractionalSecondDigits.
  // L453: an absent option selects auto.
  if (value === undefined) return 'auto'
  // L454: only primitive Numbers take the numeric path.
  if (typeof value === 'number') {
    // L458: floor, not truncation; negative fractions must fail.
    const digits = Math.floor(value)
    // L457: Math.floor preserves nonfinite values, so checking here is equivalent.
    // L459: the floored count must fit the nine fractional digits.
    if (!Number.isFinite(digits) || digits < 0 || digits > 9)
      throw new RangeError('Invalid fractionalSecondDigits')
    // L460: return the numeric precision.
    return digits
  }
  // L455: non-numbers must stringify to exactly "auto".
  if (ToString(value) !== 'auto')
    throw new RangeError('Invalid fractionalSecondDigits')
  // L456: return the auto sentinel.
  return 'auto'
}

// Instant modes use the positive direction even before the epoch.
export function roundInstant(
  value: bigint,
  quantum: bigint,
  mode: RoundingMode
): bigint {
  // https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/abstractops.html#L996-L1001
  // L996: keep the exact quotient as an integer plus remainder.
  let lower = value / quantum
  // L998: BigInt division truncates, so step down for negative nonintegers.
  if (value < 0n && value % quantum !== 0n) lower--
  const remainder = value - lower * quantum
  if (remainder === 0n) return value
  // L997: interpret the mode as positive, even for a pre-epoch instant.
  // L999: the upper candidate is lower + 1.
  // L1000: compare the exact remainder, using parity only for halfEven ties.
  let up: boolean
  if (mode === 'ceil' || mode === 'expand') up = true
  else if (mode === 'floor' || mode === 'trunc') up = false
  else if (2n * remainder !== quantum) up = 2n * remainder > quantum
  else
    up =
      mode === 'halfCeil' ||
      mode === 'halfExpand' ||
      (mode === 'halfEven' && lower % 2n !== 0n)
  // L1001: restore the unit by multiplying the chosen integer by the increment.
  return (lower + (up ? 1n : 0n)) * quantum
}
export function roundInstantOptions(value: bigint, options: unknown): bigint {
  // https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/instant.html#L183-L212
  // L183: the caller supplies its receiver.
  // L184: read(this) checks the Instant slot before touching options.
  // L185: no default rounding unit.
  if (options === undefined) throw new TypeError('roundTo is required')
  // L186: primitive strings alone get shorthand handling.
  // L187: preserve the original string as the property value.
  // L188: use a null prototype, so inherited getters cannot run.
  // L189: assign smallestUnit as an own data property.
  // L190: all other inputs take the options path.
  // L191: GetOptionsObject rejects primitives without boxing them.
  const resolved =
    typeof options === 'string'
      ? Object.assign(Object.create(null), {smallestUnit: options})
      : optionsObject(options)
  // L192: read and validate each property before reading the next.
  // L193: increment first.
  const increment = roundingIncrement(resolved.roundingIncrement)
  // L194: mode defaults to halfExpand.
  const mode = roundingMode(resolved.roundingMode, 'halfExpand')
  // L195: smallestUnit is required.
  // L196: reject date units and auto.
  const unit = timeUnit(unitOption(resolved.smallestUnit))
  if (import.meta.formatjsTemporalNativeData === true)
    return nativeTemporal()!.roundInstantUnit(value, unit, increment, mode)
  // L197: hour case.
  // L198: one day contains 24 hours.
  // L199: minute case.
  // L200: 1,440 minutes.
  // L201: second case.
  // L202: 86,400 seconds.
  // L203: millisecond case.
  // L204: 86,400,000 milliseconds.
  // L205: microsecond case.
  // L206: 86,400,000,000 microseconds.
  // L207: the remaining case uses the same ratio.
  // L208: the sixth and last supported time unit is nanosecond.
  // L209: dividing by 1 gives nsPerDay itself.
  const maximum = 86_400_000_000_000n / timeUnitNanoseconds[unit]
  // L210: allow the maximum itself, but require an exact divisor.
  if (BigInt(increment) > maximum || maximum % BigInt(increment) !== 0n)
    throw new RangeError('Rounding increment must divide a day')
  const native = nativeTemporal()
  // L211: multiply increment by unit length before rounding as if positive.
  // L212: the caller wraps these nanoseconds in a new Instant.
  return (native ? native.roundInstant : roundInstant)(
    value,
    BigInt(increment) * timeUnitNanoseconds[unit],
    mode
  )
}

export function roundDuration(
  value: bigint,
  quantum: bigint,
  mode: RoundingMode
): bigint {
  if (value >= 0n) return roundInstant(value, quantum, mode)
  const reversed: Record<RoundingMode, RoundingMode> = {
    ceil: 'floor',
    floor: 'ceil',
    expand: 'expand',
    trunc: 'trunc',
    halfCeil: 'halfFloor',
    halfFloor: 'halfCeil',
    halfExpand: 'halfExpand',
    halfTrunc: 'halfTrunc',
    halfEven: 'halfEven',
  }
  return -roundInstant(-value, quantum, reversed[mode])
}
