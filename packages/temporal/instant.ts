import {
  RangeErrorConstructor,
  TypeErrorConstructor,
  arrayIndexOf,
  bigIntFrom,
  mathMin,
  numberFrom,
} from '#packages/ecma262-abstract/intrinsics.js'
import {IsObject} from '#packages/ecma262-abstract/IsObject.js'
import {
  argumentAt,
  constructorPrototype,
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
import {
  allocateInstant,
  getSharedInstantSlot,
  nativeTemporal,
  validateInstant,
} from '#packages/temporal/native.js'
export {validateInstant} from '#packages/temporal/native.js'

// Proposal comparison §8.3.11 step 15: Format prepared Instant nanoseconds through the active backend.
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
let nativeInstantSlot: (value: object) => bigint | undefined
let nativeInstantPrototype: (value: object, prototype: object) => void
const getSlot =
  import.meta.formatjsTemporalNativeData === true
    ? (value: object) => nativeInstantSlot(value)
    : getSharedInstantSlot
// Proposal comparison §8.1.1 step 2: Convert an Instant argument with the BigInt coercion rules.
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
// Proposal comparison §8.3.4 steps 2–3: Validate the receiver and read its exact Instant epoch.
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
        // Exported proxy below owns constructor conversion and allocation.
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
// Proposal comparison §8.5.2 step 4: Supply the exact epoch to native Instant storage.
function createNativeInstant(value: bigint): InstantObject {
  return new (NativeInstant as unknown as new (value: bigint) => InstantObject)(
    value
  )
}
// Temporal comparison §8.5.2 steps 1–5. Allocate with the local Instant prototype.
export function createInstant(value: bigint): InstantObject {
  if (import.meta.formatjsTemporalNativeData === true)
    return createNativeInstant(validateInstant(value))
  return allocateInstant(InstantValue.prototype, value) as InstantObject
}
function toInstant(item: unknown): bigint {
  // Temporal comparison §8.5.3 step 1.a: copy recognized private epoch slots.
  // https://tc39.es/proposal-temporal/#sec-temporal-totemporalinstant
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
// Proposal comparison §8.5.9 steps 1–5: Prepare Instant difference settings and route exact rounding.
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
  const smallIndex = arrayIndexOf(names, smallestTime)
  const largeIndex = arrayIndexOf(
    names,
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
  // Proposal comparison §8.2.5 steps 1–3.
  // https://tc39.es/proposal-temporal/#sec-temporal.instant.compare
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
  // Proposal comparison §8.2.2 step 1.
  // https://tc39.es/proposal-temporal/#sec-temporal.instant.from
  static from(item: unknown): InstantObject {
    if (import.meta.formatjsTemporalNativeData === true)
      return createNativeInstant(toInstant(item))
    return createInstant(toInstant(item))
  }
  // Proposal comparison §8.2.4 steps 1–3.
  // https://tc39.es/proposal-temporal/#sec-temporal.instant.fromepochnanoseconds
  static fromEpochNanoseconds(epochNanoseconds: unknown): InstantObject {
    return createInstant(toBigInt(epochNanoseconds))
  }
  // Proposal comparison §8.2.3 steps 1–5.
  // https://tc39.es/proposal-temporal/#sec-temporal.instant.fromepochmilliseconds
  static fromEpochMilliseconds(epochMilliseconds: unknown): InstantObject {
    // Unary + is ToNumber; unlike BigInt(), it rejects BigInt/Symbol input.
    const milliseconds = +(epochMilliseconds as number)
    return createInstant(bigIntFrom(milliseconds) * 1_000_000n)
  }
  // Proposal comparison §8.3.15 steps 1–4.
  // https://tc39.es/proposal-temporal/#sec-temporal.instant.prototype.tozoneddatetimeiso
  toZonedDateTimeISO(timeZone: unknown): ZonedDateTimeObject {
    const value = read(this)
    return createZonedDateTime(value, timeZoneIdentifier(timeZone), 'iso8601')
  }
  // Proposal comparison §8.3.4 steps 1–3.
  // https://tc39.es/proposal-temporal/#sec-get-temporal.instant.prototype.epochnanoseconds
  get epochNanoseconds(): bigint {
    return read(this)
  }
  // Proposal comparison §8.3.3 steps 1–5.
  // https://tc39.es/proposal-temporal/#sec-get-temporal.instant.prototype.epochmilliseconds
  get epochMilliseconds(): number {
    const value = read(this)
    const truncated = value / 1_000_000n
    return numberFrom(
      value < 0n && value % 1_000_000n !== 0n ? truncated - 1n : truncated
    )
  }
  // Proposal comparison §8.3.10 steps 1–5.
  // https://tc39.es/proposal-temporal/#sec-temporal.instant.prototype.equals
  equals(other: unknown): boolean {
    return read(this) === toInstant(other)
  }
  // Proposal comparison §8.3.7 steps 1–3.
  // https://tc39.es/proposal-temporal/#sec-temporal.instant.prototype.until
  until(other: unknown, options: unknown = undefined): DurationObject {
    return difference(read(this), other, options, false)
  }
  // Proposal comparison §8.3.8 steps 1–3.
  // https://tc39.es/proposal-temporal/#sec-temporal.instant.prototype.since
  since(other: unknown, options: unknown = undefined): DurationObject {
    return difference(read(this), other, options, true)
  }
  // Proposal comparison §8.3.5 steps 1–3.
  // https://tc39.es/proposal-temporal/#sec-temporal.instant.prototype.add
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
  // Proposal comparison §8.3.6 steps 1–3.
  // https://tc39.es/proposal-temporal/#sec-temporal.instant.prototype.subtract
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
  // Proposal comparison §8.3.9 steps 1–19.
  // https://tc39.es/proposal-temporal/#sec-temporal.instant.prototype.round
  round(roundTo: unknown): InstantObject {
    if (import.meta.formatjsTemporalNativeData === true)
      return createNativeInstant(roundInstantOptions(read(this), roundTo))
    return createInstant(roundInstantOptions(read(this), roundTo))
  }
  // Proposal comparison §8.3.11 steps 1–15.
  // https://tc39.es/proposal-temporal/#sec-temporal.instant.prototype.tostring
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
  // Proposal comparison §8.3.12 steps 1–3.
  // https://tc39.es/proposal-temporal/#sec-temporal.instant.prototype.tolocalestring
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
  // Proposal comparison §8.3.13 steps 1–3.
  // https://tc39.es/proposal-temporal/#sec-temporal.instant.prototype.tojson
  toJSON(): string {
    return instantString(read(this))
  }
  // Proposal comparison §8.3.14 step 1.
  // https://tc39.es/proposal-temporal/#sec-temporal.instant.prototype.valueof
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
// Proposal comparison §8.2.1 descriptor.
// https://tc39.es/proposal-temporal/#sec-temporal.instant.prototype
export const Instant: InstantConstructor = createProxy(
  import.meta.formatjsTemporalNativeData === true
    ? (NativeInstant! as unknown as typeof InstantValue)
    : InstantValue,
  {
    // Proposal comparison §8.1.1 steps 2–4. Constructor call target supplies step 1.
    // https://tc39.es/proposal-temporal/#sec-temporal.instant
    construct(target, args, newTarget) {
      const value = validateInstant(toBigInt(argumentAt(args, 0)))
      const prototype = constructorPrototype(newTarget, target)
      if (import.meta.formatjsTemporalNativeData === true) {
        const result = createNativeInstant(value)
        if (prototype !== NativeInstant!.prototype)
          nativeInstantPrototype(result, prototype)
        return result
      }
      return allocateInstant(prototype, value)
    },
  }
)
// Proposal comparison §8.3.1 descriptor.
// https://tc39.es/proposal-temporal/#sec-temporal.instant.prototype.constructor
// Proposal comparison §8.3.2 descriptor.
// https://tc39.es/proposal-temporal/#sec-temporal.instant.prototype-%symbol.tostringtag%
Object.defineProperties(InstantValue.prototype, {
  constructor: {value: Instant, writable: true, configurable: true},
  [Symbol.toStringTag]: {value: 'Temporal.Instant', configurable: true},
})

// Proposal comparison §§8.2.1–5,8.3.1–15: forward the same public descriptors.
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
