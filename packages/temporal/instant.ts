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
  // IsValidEpochNanoseconds 1: both limits are inclusive.
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
            value !== null &&
            (typeof value === 'object' || typeof value === 'function') &&
            #value in value
              ? value.#value
              : undefined
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
    timeUnit(largest ?? names[Math.min(2, smallIndex)])
  )
  if (largeIndex > smallIndex)
    throw new RangeError('Largest unit smaller than smallest unit')
  const maximum = [24, 60, 60, 1000, 1000, 1000][smallIndex]
  if (increment >= maximum || maximum % increment !== 0)
    throw new RangeError('Invalid duration rounding increment')
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
    BigInt(increment) * timeUnitNanoseconds[smallestTime],
    mode
  )
  return createDuration(balanceDurationTime(rounded, largeIndex + 4))
}
class InstantValue implements InstantObject {
  declare readonly [Symbol.toStringTag]: 'Temporal.Instant'
  constructor(_epochNanoseconds: unknown) {
    throw new TypeError('Use the exported Instant constructor')
  }
  static compare(one: unknown, two: unknown): -1 | 0 | 1 {
    // https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/instant.html#L80-L85
    // Instant.compare 1: convert the left operand before touching the right.
    const left = toInstant(one),
      // Step 2: convert the right operand only after step 1 succeeds.
      right = toInstant(two)
    // Step 3: compare the two slot values, returning a Number, not a BigInt.
    return left < right ? -1 : left > right ? 1 : 0
  }
  static from(item: unknown): InstantObject {
    // Instant.from 1: ToTemporalInstant returns a new Instant even for an Instant input.
    if (import.meta.formatjsTemporalNativeData === true)
      return createNativeInstant(toInstant(item))
    return createInstant(toInstant(item))
  }
  static fromEpochNanoseconds(epochNanoseconds: unknown): InstantObject {
    // Instant.fromEpochNanoseconds 1: ToBigInt (not BigInt(number)).
    // Steps 2–3: createInstant validates the inclusive range before publishing the value.
    return createInstant(toBigInt(epochNanoseconds))
  }
  static fromEpochMilliseconds(epochMilliseconds: unknown): InstantObject {
    // Instant.fromEpochMilliseconds 1: unary + is ToNumber; reject BigInt/Symbol.
    const milliseconds = +(epochMilliseconds as number)
    // Steps 2–3: reject non-integral Numbers, then scale as BigInt without rounding.
    // Steps 4–5: createInstant checks the range and creates the result.
    return createInstant(BigInt(milliseconds) * 1_000_000n)
  }
  toZonedDateTimeISO(timeZone: unknown): ZonedDateTimeObject {
    // Instant.prototype.toZonedDateTimeISO 1–2: brand-check this before zone conversion.
    const value = read(this)
    // Steps 3–4: convert the explicit zone and construct with the ISO calendar.
    return createZonedDateTime(value, timeZoneIdentifier(timeZone), 'iso8601')
  }
  get epochNanoseconds(): bigint {
    // epochNanoseconds 1–3: read(this) checks the brand and returns the slot.
    return read(this)
  }
  get epochMilliseconds(): number {
    // epochMilliseconds 1–3: check the receiver and read its epoch nanoseconds.
    const value = read(this)
    // Steps 4–5: BigInt division truncates; adjust negative remainders for floor,
    // then convert the integral milliseconds to Number.
    const truncated = value / 1_000_000n
    return Number(
      value < 0n && value % 1_000_000n !== 0n ? truncated - 1n : truncated
    )
  }
  equals(other: unknown): boolean {
    // Instant.prototype.equals 1–2: check this first; 3: convert other;
    // 4–5: compare epoch nanoseconds, not object identity.
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
      throw new RangeError('Instant arithmetic requires time units')
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
      throw new RangeError('Instant arithmetic requires time units')
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
    // https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/instant.html#L232-L247
    // L232: take this as the receiver.
    // L233: reject an unbranded receiver before reading options.
    const value = read(this)
    // L234: accept an object or default to an empty one.
    const resolved = optionsObject(options)
    // L235: property access and independent validation are interleaved.
    // L236: read fractionalSecondDigits first.
    const digits = fractionalSecondDigits(resolved.fractionalSecondDigits)
    // L237: omitted roundingMode means trunc.
    const mode = roundingMode(resolved.roundingMode, 'trunc')
    // L238: "auto" is recognized here; unknown strings already throw.
    const unit = unitOption(resolved.smallestUnit, true)
    // L239: read timeZone before rejecting recognized but disallowed units.
    const zoneOption = resolved.timeZone
    // L240: allow only time units or unset, not "auto".
    // L241: hour is also invalid for string precision.
    if (unit !== undefined && timeUnit(unit) === 'hour')
      throw new RangeError('Cannot serialize with hour precision')
    const native = nativeTemporal()
    let identifier: string | undefined
    // L242: omitted timeZone skips conversion.
    // L243: both backends convert the supplied zone before rounding.
    if (native && zoneOption !== undefined) {
      const zoned = getZonedSlot(zoneOption as object)
      if (!zoned && typeof zoneOption !== 'string')
        throw new TypeError('Timezone must be a string')
      identifier = zoned?.timeZone ?? parseTimeZoneString(zoneOption as string)
    }
    const zone =
      import.meta.formatjsTemporalNativeData !== true &&
      !native &&
      zoneOption !== undefined
        ? resolveTimeZone(zoneOption)
        : undefined
    // L244: smallestUnit takes precedence over fractionalSecondDigits.
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
    if (import.meta.formatjsTemporalNativeData === true || native)
      return native!.formatInstant(
        value,
        precision,
        undefined,
        mode,
        identifier
      )
    // L245: round epoch time before looking up the output zone offset.
    const rounded = roundInstant(value, quantum, mode)
    // L246: only the rounded instant's slot is needed, not an observable wrapper.
    // L247: format with the offset at the rounded instant.
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
    // Instant.prototype.toJSON 1–2: require the Instant slot on this;
    // 3: format with no explicit zone and automatic precision, without calling this.toString.
    return instantString(read(this))
  }
  valueOf(): never {
    // Instant.prototype.valueOf 1: throw unconditionally, even for an unbranded receiver.
    throw new TypeError('Cannot convert Temporal.Instant to primitive')
  }
}
const localeStringIntrinsic = InstantValue.prototype.toString

Object.defineProperty(InstantValue, 'name', {
  value: 'Instant',
  configurable: true,
})
// A normal JS constructor allocates before its body; Temporal coerces first.
export const Instant: InstantConstructor = new Proxy(
  import.meta.formatjsTemporalNativeData === true
    ? (NativeInstant! as unknown as typeof InstantValue)
    : InstantValue,
  {
    construct(target, args, newTarget) {
      const value = validateInstant(toBigInt(args[0]))
      const prototype = Reflect.get(newTarget, 'prototype')
      if (import.meta.formatjsTemporalNativeData === true) {
        const result = createNativeInstant(value)
        const selected =
          prototype !== null &&
          (typeof prototype === 'object' || typeof prototype === 'function')
            ? prototype
            : target.prototype
        if (selected !== NativeInstant!.prototype)
          nativeInstantPrototype(result, selected)
        return result
      }
      const result = Object.create(
        prototype !== null &&
          (typeof prototype === 'object' || typeof prototype === 'function')
          ? prototype
          : target.prototype
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
