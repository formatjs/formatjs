import {getZonedSlot} from '#packages/temporal/plain-slots.js'
import {
  createZonedDateTime,
  type ZonedDateTimeObject,
} from '#packages/temporal/zoned-date-time.js'
import {timeZoneIdentifier} from '#packages/temporal/zones.js'
import {
  toDurationFields,
  createDuration,
  type DurationObject,
} from '#packages/temporal/duration.js'
import {
  durationNanoseconds,
  balanceDurationTime,
} from '#packages/temporal/duration-core.js'
// Instant facade; durations and cross-realm slots remain incomplete.
import {ToString} from '#packages/ecma262-abstract/ToString.js'
import {roundingIncrement, roundDuration} from '#packages/temporal/rounding.js'
import {ToPrimitive} from '#packages/ecma262-abstract/ToPrimitive.js'
import {formatInstant} from '#packages/temporal/instant-format.js'
import {
  fractionalSecondDigits,
  optionsObject,
  roundingMode,
  unitOption,
  timeUnit,
  timeUnitNanoseconds,
  roundInstant,
  roundInstantOptions,
  type Precision,
} from '#packages/temporal/rounding.js'
import {resolveTimeZone} from '#packages/temporal/zones.js'
import {parseInstantString} from '#packages/temporal/instant-string.js'

export interface InstantObject {
  readonly epochNanoseconds: bigint
  readonly epochMilliseconds: number
  until(other: unknown, options?: unknown): DurationObject
  since(other: unknown, options?: unknown): DurationObject
  add(other: unknown): InstantObject
  subtract(other: unknown): InstantObject
  round(roundTo: unknown): InstantObject
  toString(options?: unknown): string
  toZonedDateTimeISO(timeZone: unknown): ZonedDateTimeObject
  toJSON(): string
  equals(other: unknown): boolean
  valueOf(): never
}
export interface InstantConstructor {
  new (epochNanoseconds: unknown): InstantObject
  readonly prototype: InstantObject
  compare(one: unknown, two: unknown): -1 | 0 | 1
  from(item: unknown): InstantObject
  fromEpochNanoseconds(epochNanoseconds: unknown): InstantObject
  fromEpochMilliseconds(epochMilliseconds: unknown): InstantObject
}
const slots = new WeakMap<object, bigint>()
const getSlot = slots.get.bind(slots)
const setSlot = slots.set.bind(slots)
const limit = 8_640_000_000_000_000_000_000n
export function validateInstant(value: bigint): bigint {
  if (value < -limit || value > limit)
    throw new RangeError('Instant out of range')
  return value
}
function toBigInt(value: unknown): bigint {
  const primitive = ToPrimitive(value, 'number')
  if (
    typeof primitive !== 'bigint' &&
    typeof primitive !== 'string' &&
    typeof primitive !== 'boolean'
  )
    throw new TypeError('Invalid BigInt input')
  return BigInt(primitive)
}
function read(value: unknown): bigint {
  const result = getSlot(value as object)
  if (result === undefined) throw new TypeError('Invalid Instant receiver')
  return result
}
export function createInstant(value: bigint): InstantObject {
  const result = Object.create(InstantValue.prototype) as InstantObject
  setSlot(result, validateInstant(value))
  return result
}
function toInstant(item: unknown): bigint {
  const existing =
    getZonedSlot(item as object)?.epochNanoseconds ?? getSlot(item as object)
  if (existing !== undefined) return existing
  const primitive = ToPrimitive(item, 'string')
  if (typeof primitive !== 'string')
    throw new TypeError('Expected Instant or instant string')
  return validateInstant(parseInstantString(primitive))
}
function difference(
  value: bigint,
  other: unknown,
  options: unknown,
  since: boolean
): DurationObject {
  const end = toInstant(other)
  const resolved = optionsObject(options)
  const largestRaw = resolved.largestUnit
  const largestString = largestRaw === undefined ? 'auto' : ToString(largestRaw)
  const largest =
    largestString === 'auto' ? undefined : unitOption(largestString)
  const increment = roundingIncrement(resolved.roundingIncrement)
  const mode = roundingMode(resolved.roundingMode, 'trunc')
  const smallest = unitOption(resolved.smallestUnit)
  const smallestTime = timeUnit(smallest ?? 'nanosecond')
  const names = [
    'hour',
    'minute',
    'second',
    'millisecond',
    'microsecond',
    'nanosecond',
  ] as const
  const smallIndex = names.indexOf(smallestTime)
  const largeIndex = names.indexOf(
    timeUnit(largest ?? names[Math.min(2, smallIndex)])
  )
  if (largeIndex > smallIndex)
    throw new RangeError('Largest unit smaller than smallest unit')
  const maximum = [24, 60, 60, 1000, 1000, 1000][smallIndex]
  if (increment >= maximum || maximum % increment !== 0)
    throw new RangeError('Invalid duration rounding increment')
  const valueToRound = (end - value) * (since ? -1n : 1n)
  const rounded = roundDuration(
    valueToRound,
    BigInt(increment) * timeUnitNanoseconds[smallestTime],
    mode
  )
  return createDuration(balanceDurationTime(rounded, largeIndex + 4))
}
class InstantValue implements InstantObject {
  constructor(_epochNanoseconds: unknown) {
    throw new TypeError('Use the exported Instant constructor')
  }
  static compare(one: unknown, two: unknown): -1 | 0 | 1 {
    const left = toInstant(one),
      right = toInstant(two)
    return left < right ? -1 : left > right ? 1 : 0
  }
  static from(item: unknown): InstantObject {
    return createInstant(toInstant(item))
  }
  static fromEpochNanoseconds(epochNanoseconds: unknown): InstantObject {
    return createInstant(toBigInt(epochNanoseconds))
  }
  static fromEpochMilliseconds(epochMilliseconds: unknown): InstantObject {
    // Unary + is ToNumber; unlike BigInt(), it rejects BigInt/Symbol input.
    const milliseconds = +(epochMilliseconds as number)
    return createInstant(BigInt(milliseconds) * 1_000_000n)
  }
  toZonedDateTimeISO(timeZone: unknown): ZonedDateTimeObject {
    const value = read(this)
    return createZonedDateTime(value, timeZoneIdentifier(timeZone), 'iso8601')
  }
  get epochNanoseconds(): bigint {
    return read(this)
  }
  get epochMilliseconds(): number {
    const value = read(this)
    const truncated = value / 1_000_000n
    return Number(
      value < 0n && value % 1_000_000n !== 0n ? truncated - 1n : truncated
    )
  }
  equals(other: unknown): boolean {
    return read(this) === toInstant(other)
  }
  until(other: unknown, options: unknown = undefined): DurationObject {
    return difference(read(this), other, options, false)
  }
  since(other: unknown, options: unknown = undefined): DurationObject {
    return difference(read(this), other, options, true)
  }
  add(other: unknown): InstantObject {
    const value = read(this),
      fields = toDurationFields(other)
    if (fields.years || fields.months || fields.weeks || fields.days)
      throw new RangeError('Instant arithmetic requires time units')
    return createInstant(value + durationNanoseconds(fields, false))
  }
  subtract(other: unknown): InstantObject {
    const value = read(this),
      fields = toDurationFields(other)
    if (fields.years || fields.months || fields.weeks || fields.days)
      throw new RangeError('Instant arithmetic requires time units')
    return createInstant(value - durationNanoseconds(fields, false))
  }
  round(roundTo: unknown): InstantObject {
    return createInstant(roundInstantOptions(read(this), roundTo))
  }
  toString(options: unknown = undefined): string {
    const value = read(this)
    const resolved = optionsObject(options)
    const digits = fractionalSecondDigits(resolved.fractionalSecondDigits)
    const mode = roundingMode(resolved.roundingMode, 'trunc')
    const unit = unitOption(resolved.smallestUnit)
    const zoneOption = resolved.timeZone
    if (unit !== undefined && timeUnit(unit) === 'hour')
      throw new RangeError('Cannot serialize with hour precision')
    const zone =
      zoneOption === undefined ? undefined : resolveTimeZone(zoneOption)
    const precision: Precision =
      unit === 'minute'
        ? 'minute'
        : unit === 'second'
          ? 0
          : unit === 'millisecond'
            ? 3
            : unit === 'microsecond'
              ? 6
              : unit === 'nanosecond'
                ? 9
                : digits
    const quantum =
      precision === 'auto'
        ? 1n
        : precision === 'minute'
          ? timeUnitNanoseconds.minute
          : 10n ** BigInt(9 - precision)
    const rounded = roundInstant(value, quantum, mode)
    return formatInstant(rounded, precision, zone?.offsetNanoseconds(rounded))
  }
  toJSON(): string {
    return formatInstant(read(this))
  }
  valueOf(): never {
    throw new TypeError('Cannot convert Temporal.Instant to primitive')
  }
}
Object.defineProperty(InstantValue, 'name', {
  value: 'Instant',
  configurable: true,
})
// A normal JS constructor allocates before its body; Temporal coerces first.
export const Instant: InstantConstructor = new Proxy(InstantValue, {
  construct(target, args, newTarget) {
    const value = validateInstant(toBigInt(args[0]))
    const prototype = Reflect.get(newTarget, 'prototype')
    const result = Object.create(
      prototype !== null &&
        (typeof prototype === 'object' || typeof prototype === 'function')
        ? prototype
        : target.prototype
    )
    setSlot(result, value)
    return result
  },
})
Object.defineProperties(InstantValue.prototype, {
  constructor: {value: Instant, writable: true, configurable: true},
  [Symbol.toStringTag]: {value: 'Temporal.Instant', configurable: true},
})
