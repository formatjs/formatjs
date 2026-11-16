import {defineGetters} from '#packages/temporal/accessors.js'
import {localeDateTime} from '#packages/temporal/locale.js'
import {nativeTemporal} from '#packages/temporal/native.js'
import {ToString} from '#packages/ecma262-abstract/ToString.js'
import {
  getTimeSlot as getSlot,
  setTimeSlot as setSlot,
  getDateTimeSlot,
  getZonedDateTimeSlot,
  getZonedSlot,
  getDateSlot,
  getYearMonthSlot,
  getMonthDaySlot,
} from '#packages/temporal/plain-slots.js'
import {parsePlainTimeString} from '#packages/temporal/instant-string.js'
import {formatInstant} from '#packages/temporal/instant-format.js'
import {
  createDuration,
  toDurationFields,
  type DurationObject,
} from '#packages/temporal/duration.js'
import {
  durationNanoseconds,
  balanceDurationTime,
} from '#packages/temporal/duration-core.js'
import {
  optionsObject,
  unitOption,
  timeUnit,
  timeUnitNanoseconds,
  fractionalSecondDigits,
  roundingIncrement,
  roundingMode,
  roundInstant,
  roundDuration,
  type TimeUnit,
  type RoundingMode,
  type Precision,
} from '#packages/temporal/rounding.js'

export interface PlainTimeObject {
  readonly [Symbol.toStringTag]: 'Temporal.PlainTime'
  readonly hour: number
  readonly minute: number
  readonly second: number
  readonly millisecond: number
  readonly microsecond: number
  readonly nanosecond: number
  with(item: unknown, options?: unknown): PlainTimeObject
  add(duration: unknown): PlainTimeObject
  subtract(duration: unknown): PlainTimeObject
  until(other: unknown, options?: unknown): DurationObject
  since(other: unknown, options?: unknown): DurationObject
  round(roundTo: unknown): PlainTimeObject
  equals(other: unknown): boolean
  toString(options?: unknown): string
  toLocaleString(locales?: unknown, options?: unknown): string
  toJSON(): string
  valueOf(): never
}
export interface PlainTimeConstructor {
  new (
    hour?: unknown,
    minute?: unknown,
    second?: unknown,
    millisecond?: unknown,
    microsecond?: unknown,
    nanosecond?: unknown
  ): PlainTimeObject
  readonly prototype: PlainTimeObject
  from(item: unknown, options?: unknown): PlainTimeObject
  compare(one: unknown, two: unknown): -1 | 0 | 1
}
const names = [
  'hour',
  'minute',
  'second',
  'millisecond',
  'microsecond',
  'nanosecond',
] as const
const factors = names.map(name => timeUnitNanoseconds[name])
const maxima = [24, 60, 60, 1000, 1000, 1000]
const day = 86_400_000_000_000n
function read(value: unknown): bigint {
  const result = getSlot(value as object)
  if (result === undefined) throw new TypeError('Invalid PlainTime receiver')
  return result
}
function fields(value: bigint): number[] {
  return factors.map((factor, index) =>
    Number((value / factor) % BigInt(maxima[index]))
  )
}
function integer(value: unknown): number {
  const result = Math.trunc(+(value as number))
  if (!Number.isInteger(result))
    throw new RangeError('Time field must be finite')
  return result || 0
}
function overflow(options: unknown): boolean {
  const raw = optionsObject(options).overflow
  const value = raw === undefined ? 'constrain' : ToString(raw)
  if (value !== 'constrain' && value !== 'reject')
    throw new RangeError('Invalid overflow')
  return value === 'constrain'
}
function regulate(values: number[], constrain: boolean): bigint {
  const native = nativeTemporal()
  if (native) return native.regulatePlainTime(values, constrain)
  let result = 0n
  for (let index = 0; index < 6; index++) {
    let value = values[index]
    if (constrain) value = Math.max(0, Math.min(maxima[index] - 1, value))
    if (value < 0 || value >= maxima[index])
      throw new RangeError('Time out of range')
    result += BigInt(value) * factors[index]
  }
  return result
}
function object(value: unknown): value is Record<string, unknown> {
  return (
    value !== null && (typeof value === 'object' || typeof value === 'function')
  )
}
function timeFields(
  item: Record<string, unknown>,
  initial = [0, 0, 0, 0, 0, 0]
): number[] {
  const result = [...initial]
  let any = false
  for (const index of [0, 4, 3, 1, 5, 2]) {
    const raw = item[names[index]]
    if (raw !== undefined) {
      result[index] = integer(raw)
      any = true
    }
  }
  if (!any) throw new TypeError('At least one time field required')
  return result
}
function toTime(value: unknown, options?: unknown): bigint {
  const existing = getSlot(value as object)
  if (existing !== undefined) {
    overflow(options)
    return existing
  }
  const datetime =
    getDateTimeSlot(value as object) ?? getZonedDateTimeSlot(value as object)
  if (datetime) {
    overflow(options)
    return ((datetime.epochNanoseconds % day) + day) % day
  }
  if (object(value)) {
    const values = timeFields(value)
    return regulate(values, overflow(options))
  }
  if (typeof value !== 'string')
    throw new TypeError('Expected time string or object')
  const result = parsePlainTimeString(value)
  overflow(options)
  return result
}
function create(value: bigint): PlainTimeObject {
  const result = Object.create(PlainTimeValue.prototype) as PlainTimeObject
  setSlot(result, ((value % day) + day) % day)
  return result
}
export function createPlainTime(value: bigint): PlainTimeObject {
  return create(value)
}
function validateIncrement(unit: TimeUnit, increment: number): void {
  const maximum = maxima[names.indexOf(unit)]
  if (increment >= maximum || maximum % increment !== 0)
    throw new RangeError('Invalid time rounding increment')
}
export function roundTime(
  value: bigint,
  unit: TimeUnit,
  increment: number,
  mode: RoundingMode
): bigint {
  validateIncrement(unit, increment)
  const native = nativeTemporal()
  if (native) return native.roundPlainTime(value, unit, increment, mode)
  const index = names.indexOf(unit)
  const parent = index === 0 ? day : factors[index - 1]
  const base = (value / parent) * parent
  return (
    base + roundInstant(value - base, factors[index] * BigInt(increment), mode)
  )
}
function difference(
  value: bigint,
  other: unknown,
  options: unknown,
  since: boolean
): DurationObject {
  const end = toTime(other)
  const resolved = optionsObject(options)
  const largestRaw = resolved.largestUnit
  const largestString = largestRaw === undefined ? 'auto' : ToString(largestRaw)
  const largest =
    largestString === 'auto' ? undefined : unitOption(largestString)
  const increment = roundingIncrement(resolved.roundingIncrement)
  const mode = roundingMode(resolved.roundingMode, 'trunc')
  const smallest = timeUnit(unitOption(resolved.smallestUnit) ?? 'nanosecond')
  const smallIndex = names.indexOf(smallest),
    largeIndex = names.indexOf(timeUnit(largest ?? 'hour'))
  if (largeIndex > smallIndex)
    throw new RangeError('Largest unit smaller than smallest unit')
  validateIncrement(smallest, increment)
  const native = nativeTemporal()
  if (native)
    return createDuration(
      native.differencePlainTime(
        since ? end : value,
        since ? value : end,
        names[largeIndex],
        smallest,
        increment,
        mode
      )
    )
  return createDuration(
    balanceDurationTime(
      roundDuration(
        (end - value) * (since ? -1n : 1n),
        factors[smallIndex] * BigInt(increment),
        mode
      ),
      largeIndex + 4
    )
  )
}
function add(value: bigint, other: unknown, sign: bigint): PlainTimeObject {
  const duration = toDurationFields(other)
  const native = nativeTemporal()
  if (native) return create(native.addPlainTime(value, duration, sign < 0n))
  return create(value + sign * durationNanoseconds(duration, false))
}
function format(
  value: bigint,
  precision: Precision = 'auto',
  mode: RoundingMode = 'trunc'
): string {
  const native = nativeTemporal()
  if (native) return native.formatPlainTime(value, precision, mode)
  const quantum =
    precision === 'auto'
      ? 1n
      : precision === 'minute'
        ? factors[1]
        : 10n ** BigInt(9 - precision)
  return formatInstant(
    quantum === 1n ? value : roundInstant(value, quantum, mode) % day,
    precision
  ).slice(11, -1)
}
class PlainTimeValue implements PlainTimeObject {
  declare readonly [Symbol.toStringTag]: 'Temporal.PlainTime'
  constructor(
    _hour: unknown = undefined,
    _minute?: unknown,
    _second?: unknown,
    _millisecond?: unknown,
    _microsecond?: unknown,
    _nanosecond?: unknown
  ) {
    throw new TypeError('Use exported PlainTime constructor')
  }
  declare readonly hour: number
  declare readonly minute: number
  declare readonly second: number
  declare readonly millisecond: number
  declare readonly microsecond: number
  declare readonly nanosecond: number
  static from(item: unknown, options: unknown = undefined): PlainTimeObject {
    return create(toTime(item, options))
  }
  static compare(one: unknown, two: unknown): -1 | 0 | 1 {
    const left = toTime(one),
      right = toTime(two)
    return left < right ? -1 : left > right ? 1 : 0
  }
  with(item: unknown, options: unknown = undefined): PlainTimeObject {
    const value = read(this)
    if (
      !object(item) ||
      getSlot(item) !== undefined ||
      getDateTimeSlot(item) ||
      getZonedSlot(item) ||
      getDateSlot(item) ||
      getYearMonthSlot(item) ||
      getMonthDaySlot(item)
    )
      throw new TypeError('Expected partial time object')
    if (item.calendar !== undefined || item.timeZone !== undefined)
      throw new TypeError('Unexpected calendar or timeZone')
    const values = timeFields(item, fields(value))
    return create(regulate(values, overflow(options)))
  }
  add(duration: unknown): PlainTimeObject {
    return add(read(this), duration, 1n)
  }
  subtract(duration: unknown): PlainTimeObject {
    return add(read(this), duration, -1n)
  }
  until(other: unknown, options: unknown = undefined): DurationObject {
    return difference(read(this), other, options, false)
  }
  since(other: unknown, options: unknown = undefined): DurationObject {
    return difference(read(this), other, options, true)
  }
  equals(other: unknown): boolean {
    return read(this) === toTime(other)
  }
  round(roundTo: unknown): PlainTimeObject {
    const value = read(this)
    if (roundTo === undefined) throw new TypeError('roundTo required')
    const resolved: Record<string, unknown> =
      typeof roundTo === 'string'
        ? Object.assign(Object.create(null), {smallestUnit: roundTo})
        : optionsObject(roundTo)
    const increment = roundingIncrement(resolved.roundingIncrement)
    const mode = roundingMode(resolved.roundingMode, 'halfExpand')
    const unit = timeUnit(unitOption(resolved.smallestUnit))
    return create(roundTime(value, unit, increment, mode))
  }
  toString(options: unknown = undefined): string {
    const value = read(this),
      resolved = optionsObject(options)
    const digits = fractionalSecondDigits(resolved.fractionalSecondDigits)
    const mode = roundingMode(resolved.roundingMode, 'trunc')
    const raw = unitOption(resolved.smallestUnit)
    if (raw !== undefined && timeUnit(raw) === 'hour')
      throw new RangeError('Cannot format hours only')
    const precision: Precision =
      raw === 'minute'
        ? 'minute'
        : raw === 'second'
          ? 0
          : raw === 'millisecond'
            ? 3
            : raw === 'microsecond'
              ? 6
              : raw === 'nanosecond'
                ? 9
                : digits
    return format(value, precision, mode)
  }
  toLocaleString(
    locales: unknown = undefined,
    options: unknown = undefined
  ): string {
    const slot = read(this)
    return localeDateTime(
      {kind: 'PlainTime', epochNanoseconds: slot},
      locales,
      options,
      () => localeStringIntrinsic.call(this)
    )
  }
  toJSON(): string {
    return format(read(this))
  }
  valueOf(): never {
    throw new TypeError('Cannot convert Temporal.PlainTime to primitive')
  }
}
const localeStringIntrinsic = PlainTimeValue.prototype.toString

Object.defineProperty(PlainTimeValue, 'name', {
  value: 'PlainTime',
  configurable: true,
})
export const PlainTime: PlainTimeConstructor = new Proxy(PlainTimeValue, {
  construct(target, args, newTarget) {
    const values = names.map((_, index) =>
      args[index] === undefined ? 0 : integer(args[index])
    )
    const value = regulate(values, false)
    const prototype = Reflect.get(newTarget, 'prototype')
    const result = Object.create(
      object(prototype) ? prototype : target.prototype
    )
    setSlot(result, value)
    return result
  },
})
Object.defineProperties(PlainTimeValue.prototype, {
  constructor: {value: PlainTime, writable: true, configurable: true},
  [Symbol.toStringTag]: {value: 'Temporal.PlainTime', configurable: true},
})
defineGetters(
  PlainTimeValue.prototype,
  names,
  (receiver, _name, index) => fields(read(receiver))[index]
)
