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
  if (value === undefined) return fallback
  const mode = ToString(value)
  if (!modes.includes(mode)) throw new RangeError('Invalid rounding mode')
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
  if (value === undefined) return 1
  const increment = Math.trunc(+(value as number))
  if (!Number.isFinite(increment) || increment < 1 || increment > 1_000_000_000)
    throw new RangeError('Invalid rounding increment')
  return increment
}
export function fractionalSecondDigits(value: unknown): 'auto' | number {
  if (value === undefined) return 'auto'
  if (typeof value === 'number') {
    const digits = Math.floor(value)
    if (!Number.isFinite(digits) || digits < 0 || digits > 9)
      throw new RangeError('Invalid fractionalSecondDigits')
    return digits
  }
  if (ToString(value) !== 'auto')
    throw new RangeError('Invalid fractionalSecondDigits')
  return 'auto'
}

// Instant modes use the positive direction even before the epoch.
export function roundInstant(
  value: bigint,
  quantum: bigint,
  mode: RoundingMode
): bigint {
  let lower = value / quantum
  if (value < 0n && value % quantum !== 0n) lower--
  const remainder = value - lower * quantum
  if (remainder === 0n) return value
  let up: boolean
  if (mode === 'ceil' || mode === 'expand') up = true
  else if (mode === 'floor' || mode === 'trunc') up = false
  else if (2n * remainder !== quantum) up = 2n * remainder > quantum
  else
    up =
      mode === 'halfCeil' ||
      mode === 'halfExpand' ||
      (mode === 'halfEven' && lower % 2n !== 0n)
  return (lower + (up ? 1n : 0n)) * quantum
}
export function roundInstantOptions(value: bigint, options: unknown): bigint {
  if (options === undefined) throw new TypeError('roundTo is required')
  const resolved =
    typeof options === 'string'
      ? Object.assign(Object.create(null), {smallestUnit: options})
      : optionsObject(options)
  const increment = roundingIncrement(resolved.roundingIncrement)
  const mode = roundingMode(resolved.roundingMode, 'halfExpand')
  const unit = timeUnit(unitOption(resolved.smallestUnit))
  const maximum = 86_400_000_000_000n / timeUnitNanoseconds[unit]
  if (BigInt(increment) > maximum || maximum % BigInt(increment) !== 0n)
    throw new RangeError('Rounding increment must divide a day')
  const native = nativeTemporal()
  return (
    import.meta.formatjsTemporalNativeData === true || native
      ? native!.roundInstant
      : roundInstant
  )(value, BigInt(increment) * timeUnitNanoseconds[unit], mode)
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
