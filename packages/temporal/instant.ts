import {
  RangeErrorConstructor,
  TypeErrorConstructor,
  bigIntFrom,
  mathMin,
  numberFrom,
} from '#packages/ecma262-abstract/intrinsics.js'
import {IsObject} from '#packages/ecma262-abstract/IsObject.js'
import {
  argumentAt,
  createObject,
  createProxy,
} from '#packages/temporal/intrinsics.js'
import {localeDateTime} from '#packages/temporal/locale.js'
import {getZonedSlot} from '#packages/temporal/plain-slots.js'
import {
  createZonedDateTime,
  type ZonedDateTimeObject,
} from '#packages/temporal/zoned-date-time.js'
import {timeZoneIdentifier} from '#packages/temporal/zones.js'
import {
  toDurationFields,
  toNativeDurationFields,
  createDuration,
  createNativeDuration,
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
import {parseTimeZoneString} from '#packages/temporal/instant-string.js'
import {parseInstantString} from '#packages/temporal/instant-string.js'
import {nativeTemporal} from '#packages/temporal/native.js'

function instantString(
  value: bigint,
  precision: Precision = 'auto',
  offset?: bigint
): string {
  const native = nativeTemporal()
  return import.meta.formatjsTemporalNativeData === true || native
    ? native!.formatInstant(value, precision, offset)
    : formatInstant(value, precision, offset)
}

export interface InstantObject {
  readonly [Symbol.toStringTag]: 'Temporal.Instant'
  readonly epochNanoseconds: bigint
  readonly epochMilliseconds: number
  until(other: unknown, options?: unknown): DurationObject
  since(other: unknown, options?: unknown): DurationObject
  add(other: unknown): InstantObject
  subtract(other: unknown): InstantObject
  round(roundTo: unknown): InstantObject
  toString(options?: unknown): string
  toZonedDateTimeISO(timeZone: unknown): ZonedDateTimeObject
  toLocaleString(locales?: unknown, options?: unknown): string
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
let nativeInstantSlot: (value: object) => bigint | undefined
let nativeInstantPrototype: (value: object, prototype: object) => void
const getSlot =
  import.meta.formatjsTemporalNativeData === true
    ? (value: object) => nativeInstantSlot(value)
    : slots.get.bind(slots)
const setSlot = slots.set.bind(slots)
const limit = 8_640_000_000_000_000_000_000n
export function validateInstant(value: bigint): bigint {
  // https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/instant.html#L369
  // L369: inclusive exact epoch bounds; rejection implements the predicate false result.
  if (value < -limit || value > limit)
    throw new RangeErrorConstructor('Instant out of range')
  return value
}
function toBigInt(value: unknown): bigint {
  const primitive = ToPrimitive(value, 'number')
  if (
    typeof primitive !== 'bigint' &&
    typeof primitive !== 'string' &&
    typeof primitive !== 'boolean'
  )
    throw new TypeErrorConstructor('Invalid BigInt input')
  return bigIntFrom(primitive)
}
function read(value: unknown): bigint {
  const result = getSlot(value as object)
  if (result === undefined)
    throw new TypeErrorConstructor('Invalid Instant receiver')
  return result
}
const NativeInstant =
  import.meta.formatjsTemporalNativeData === true
    ? class {
        #value: bigint
        constructor(value: bigint) {
          this.#value = value
        }
        static {
          const setPrototype = Object.setPrototypeOf
          nativeInstantPrototype = (value, prototype) => {
            setPrototype(value, prototype)
          }
          nativeInstantSlot = (value: object) =>
            IsObject(value) && #value in value ? value.#value : undefined
        }
      }
    : undefined
function createNativeInstant(value: bigint): InstantObject {
  return new (NativeInstant as unknown as new (value: bigint) => InstantObject)(
    value
  )
}
export function createInstant(value: bigint): InstantObject {
  if (import.meta.formatjsTemporalNativeData === true)
    return createNativeInstant(validateInstant(value))
  const result = createObject(InstantValue.prototype) as InstantObject
  setSlot(result, validateInstant(value))
  return result
}
function toInstant(item: unknown): bigint {
  const existing =
    getZonedSlot(item as object)?.epochNanoseconds ?? getSlot(item as object)
  if (existing !== undefined) return existing
  const primitive = ToPrimitive(item, 'string')
  if (typeof primitive !== 'string')
    throw new TypeErrorConstructor('Expected Instant or instant string')
  if (import.meta.formatjsTemporalNativeData === true)
    return parseInstantString(primitive)
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
    timeUnit(largest ?? names[mathMin(2, smallIndex)])
  )
  if (largeIndex > smallIndex)
    throw new RangeErrorConstructor('Largest unit smaller than smallest unit')
  const maximum = [24, 60, 60, 1000, 1000, 1000][smallIndex]
  if (increment >= maximum || maximum % increment !== 0)
    throw new RangeErrorConstructor('Invalid duration rounding increment')
  const native = nativeTemporal()
  if (import.meta.formatjsTemporalNativeData === true || native)
    return (
      import.meta.formatjsTemporalNativeData === true
        ? createNativeDuration
        : createDuration
    )(
      native!.differenceInstant(
        since ? end : value,
        since ? value : end,
        names[largeIndex],
        smallestTime,
        increment,
        mode
      )
    )
  const valueToRound = (end - value) * (since ? -1n : 1n)
  const rounded = roundDuration(
    valueToRound,
    bigIntFrom(increment) * timeUnitNanoseconds[smallestTime],
    mode
  )
  return createDuration(balanceDurationTime(rounded, largeIndex + 4))
}
class InstantValue implements InstantObject {
  declare readonly [Symbol.toStringTag]: 'Temporal.Instant'
  constructor(_epochNanoseconds: unknown) {
    throw new TypeErrorConstructor('Use the exported Instant constructor')
  }
  static compare(one: unknown, two: unknown): -1 | 0 | 1 {
    const left = toInstant(one),
      right = toInstant(two)
    // https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/instant.html#L435-L437
    // L435: a greater first epoch returns 1.
    // L436: a lesser first epoch returns -1.
    // L437: equal epochs return 0.
    // https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/instant.html#L85
    // L85: compare the private epochs and return a Number sign.
    return left < right ? -1 : left > right ? 1 : 0
  }
  static from(item: unknown): InstantObject {
    if (import.meta.formatjsTemporalNativeData === true)
      return createNativeInstant(toInstant(item))
    return createInstant(toInstant(item))
  }
  static fromEpochNanoseconds(epochNanoseconds: unknown): InstantObject {
    return createInstant(toBigInt(epochNanoseconds))
  }
  static fromEpochMilliseconds(epochMilliseconds: unknown): InstantObject {
    // Unary + is ToNumber; unlike BigInt(), it rejects BigInt/Symbol input.
    const milliseconds = +(epochMilliseconds as number)
    return createInstant(bigIntFrom(milliseconds) * 1_000_000n)
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
    return numberFrom(
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
      fields =
        import.meta.formatjsTemporalNativeData === true
          ? toNativeDurationFields(other, false)
          : toDurationFields(other)
    if (fields.years || fields.months || fields.weeks || fields.days)
      throw new RangeErrorConstructor('Instant arithmetic requires time units')
    const native = nativeTemporal()
    if (import.meta.formatjsTemporalNativeData === true)
      return createNativeInstant(native!.addInstant(value, fields, false))
    return createInstant(
      native
        ? native.addInstant(value, fields, false)
        : value + durationNanoseconds(fields, false)
    )
  }
  subtract(other: unknown): InstantObject {
    const value = read(this),
      fields =
        import.meta.formatjsTemporalNativeData === true
          ? toNativeDurationFields(other, false)
          : toDurationFields(other)
    if (fields.years || fields.months || fields.weeks || fields.days)
      throw new RangeErrorConstructor('Instant arithmetic requires time units')
    const native = nativeTemporal()
    if (import.meta.formatjsTemporalNativeData === true)
      return createNativeInstant(native!.addInstant(value, fields, true))
    return createInstant(
      native
        ? native.addInstant(value, fields, true)
        : value - durationNanoseconds(fields, false)
    )
  }
  round(roundTo: unknown): InstantObject {
    if (import.meta.formatjsTemporalNativeData === true)
      return createNativeInstant(roundInstantOptions(read(this), roundTo))
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
      throw new RangeErrorConstructor('Cannot serialize with hour precision')
    const native = nativeTemporal()
    let identifier: string | undefined
    if (native && zoneOption !== undefined) {
      const zoned = getZonedSlot(zoneOption as object)
      if (!zoned && typeof zoneOption !== 'string')
        throw new TypeErrorConstructor('Timezone must be a string')
      identifier = zoned?.timeZone ?? parseTimeZoneString(zoneOption as string)
    }
    const zone =
      import.meta.formatjsTemporalNativeData !== true &&
      !native &&
      zoneOption !== undefined
        ? resolveTimeZone(zoneOption)
        : undefined
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
          : 10n ** bigIntFrom(9 - precision)
    if (import.meta.formatjsTemporalNativeData === true || native)
      return native!.formatInstant(
        value,
        precision,
        undefined,
        mode,
        identifier
      )
    const rounded = roundInstant(value, quantum, mode)
    return instantString(rounded, precision, zone?.offsetNanoseconds(rounded))
  }
  toLocaleString(
    locales: unknown = undefined,
    options: unknown = undefined
  ): string {
    const slot = read(this)
    return localeDateTime(
      {kind: 'Instant', epochNanoseconds: slot},
      locales,
      options,
      () => localeStringIntrinsic.call(this)
    )
  }
  toJSON(): string {
    return instantString(read(this))
  }
  valueOf(): never {
    throw new TypeErrorConstructor(
      'Cannot convert Temporal.Instant to primitive'
    )
  }
}
const localeStringIntrinsic = InstantValue.prototype.toString

Object.defineProperty(InstantValue, 'name', {
  value: 'Instant',
  configurable: true,
})
// A normal JS constructor allocates before its body; Temporal coerces first.
export const Instant: InstantConstructor = createProxy(
  import.meta.formatjsTemporalNativeData === true
    ? (NativeInstant! as unknown as typeof InstantValue)
    : InstantValue,
  {
    construct(target, args, newTarget) {
      const value = validateInstant(toBigInt(argumentAt(args, 0)))
      const prototype = newTarget.prototype
      if (import.meta.formatjsTemporalNativeData === true) {
        const result = createNativeInstant(value)
        const selected = IsObject(prototype) ? prototype : target.prototype
        if (selected !== NativeInstant!.prototype)
          nativeInstantPrototype(result, selected)
        return result
      }
      const result = createObject(
        IsObject(prototype) ? prototype : target.prototype
      )
      setSlot(result, value)
      return result
    },
  }
)
Object.defineProperties(InstantValue.prototype, {
  constructor: {value: Instant, writable: true, configurable: true},
  [Symbol.toStringTag]: {value: 'Temporal.Instant', configurable: true},
})

if (import.meta.formatjsTemporalNativeData === true) {
  Object.defineProperty(NativeInstant!, 'name', {
    value: 'Instant',
    configurable: true,
  })
  for (const name of [
    'compare',
    'from',
    'fromEpochNanoseconds',
    'fromEpochMilliseconds',
  ])
    Object.defineProperty(
      NativeInstant!,
      name,
      Object.getOwnPropertyDescriptor(InstantValue, name)!
    )
  Object.defineProperties(
    NativeInstant!.prototype,
    Object.getOwnPropertyDescriptors(InstantValue.prototype)
  )
}
