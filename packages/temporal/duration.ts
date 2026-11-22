import {addDate, nsPerDay} from '#packages/temporal/date-core.js'
import {HasOwnProperty} from '#packages/ecma262-abstract/HasOwnProperty.js'
import {
  RangeErrorConstructor,
  TypeErrorConstructor,
  arrayEvery,
  arrayIncludes,
  arrayIndexOf,
  bigIntFrom,
  mathAbs,
  mathMax,
  mathMin,
} from '#packages/ecma262-abstract/intrinsics.js'
import {IsObject} from '#packages/ecma262-abstract/IsObject.js'
import {
  argumentAt,
  constructorPrototype,
  createObject,
  createProxy,
} from '#packages/temporal/intrinsics.js'
import {defineGetters} from '#packages/temporal/accessors.js'
import {nativeTemporal} from '#packages/temporal/native.js'
import {localeDuration} from '#packages/temporal/locale.js'
import {formatDuration} from '#packages/temporal/duration-format.js'
import {ToString} from '#packages/ecma262-abstract/ToString.js'
import {
  toRelativeTo,
  relativeTotal,
  relativeEndpoint,
  relativeRound,
} from '#packages/temporal/relative-duration.js'
import {
  durationFieldNames,
  durationFieldReadOrder,
  durationNanoseconds,
  maxDurationNanoseconds,
  durationTotalNumber,
  durationSign,
  integralDurationNumber,
  partialDuration,
  parseDurationString,
  validateDuration,
  zeroDuration,
  largestDurationField,
  balanceDurationTime,
  type DurationFields,
} from '#packages/temporal/duration-core.js'
import {
  optionsObject,
  unitOptions,
  fractionalSecondDigits,
  roundingMode,
  unitOption,
  roundDuration,
  roundingIncrement,
  timeUnitNanoseconds,
  type TimeUnit,
} from '#packages/temporal/rounding.js'

export interface DurationObject extends Readonly<DurationFields> {
  readonly [Symbol.toStringTag]: 'Temporal.Duration'
  readonly sign: number
  readonly blank: boolean
  with(fields: unknown): DurationObject
  negated(): DurationObject
  abs(): DurationObject
  add(other: unknown): DurationObject
  subtract(other: unknown): DurationObject
  round(roundTo: unknown): DurationObject
  total(options: unknown): number
  toString(options?: unknown): string
  toLocaleString(locales?: unknown, options?: unknown): string
  toJSON(): string
  valueOf(): never
}
export interface DurationConstructor {
  new (...values: unknown[]): DurationObject
  readonly prototype: DurationObject
  compare(one: unknown, two: unknown, options?: unknown): -1 | 0 | 1
  from(value: unknown): DurationObject
}
const slots = new WeakMap<object, DurationFields>()
const getSlot = slots.get.bind(slots),
  setSlot = slots.set.bind(slots)
// Temporal comparison §7.3.18 step 2, §7.3.19 step 2.
// Read the private Duration record for receiver methods.
function read(value: unknown): DurationFields {
  const fields = getSlot(value as object)
  if (!fields) throw new TypeErrorConstructor('Invalid Duration receiver')
  return fields
}
// ECMA-262 preview §22.15.5.4: copy a branded record, parse a string, or prepare public fields.
// https://tc39.es/ecma262/pr/3966/#sec-totemporalduration
export function toDurationFields(value: unknown): DurationFields {
  const existing = getSlot(value as object)
  if (existing) return {...existing}
  if (typeof value === 'string') return parseDurationString(value)
  return toNativeDurationFields(value)
}
// Temporal comparison §7.5.12 steps 1–14.
// Prepare duration fields for native operations.
/** @internal Validate before options getters; no-options operations defer to Rust. */
export function toNativeDurationFields(
  value: unknown,
  validate = true
): DurationFields {
  const existing = getSlot(value as object)
  if (existing) return existing
  if (typeof value === 'string') return parseDurationString(value)
  if (!IsObject(value))
    throw new TypeErrorConstructor('Duration fields must be an object')
  const fields = zeroDuration()
  let found = false
  for (let index = 0; index < durationFieldReadOrder.length; index++) {
    const field = durationFieldReadOrder[index]
    const number = (value as Record<string, unknown>)[field]
    if (number !== undefined) {
      fields[field] = integralDurationNumber(number)
      found = true
    }
  }
  if (!found) throw new TypeErrorConstructor('Duration fields required')
  return validate ? validateDuration(fields) : fields
}
// Fields must already be normalized and validated.
// Temporal comparison §7.5.19 steps 2–14.
// Allocate the default Duration from a validated native record.
export function createNativeDuration(fields: DurationFields): DurationObject {
  const value = createObject(DurationValue.prototype) as DurationObject
  setSlot(value, fields)
  return value
}
// ECMA-262 preview §22.15.5.1: validate, allocate and initialize a fresh Duration.
// https://tc39.es/ecma262/pr/3966/#sec-createtemporalduration
// ECMA-262 preview §22.15.4: ordinary instances hold private slots.
// https://tc39.es/ecma262/pr/3966/#sec-properties-of-temporal-duration-instances
export function createDuration(fields: DurationFields): DurationObject {
  const value = createObject(DurationValue.prototype) as DurationObject
  setSlot(value, validateDuration({...fields}))
  return value
}
// ECMA-262 preview §22.15.5.6 steps 1–11: combine fixed-length durations.
// https://tc39.es/ecma262/pr/3966/#sec-adddurations
// Add or subtract durations on the prepared 24-hour-day path.
function addDurations(
  one: DurationFields,
  other: unknown,
  sign: number
): DurationObject {
  if (import.meta.formatjsTemporalNativeData === true) {
    const two = toNativeDurationFields(other, false)
    return createNativeDuration(
      nativeTemporal()!.addDuration(one, two, sign < 0)
    )
  }
  const two = toDurationFields(other)
  const native = nativeTemporal()
  if (native) return createDuration(native.addDuration(one, two, sign < 0))
  // ECMA-262 preview §22.3.16.2 steps 1–10: lower field index means larger unit.
  // https://tc39.es/ecma262/pr/3966/#sec-largeroftwotemporalunits
  const largest = mathMin(largestDurationField(one), largestDurationField(two))
  if (largest < 3)
    throw new RangeErrorConstructor(
      'Calendar units cannot be added without a calendar'
    )
  return createDuration(
    balanceDurationTime(
      durationNanoseconds(one) + bigIntFrom(sign) * durationNanoseconds(two),
      largest
    )
  )
}

class DurationValue {
  constructor(..._values: unknown[]) {
    throw new TypeErrorConstructor('Use exported Duration constructor')
  }
  static compare(
    one: unknown,
    two: unknown,
    options: unknown = undefined
  ): -1 | 0 | 1 {
    // Temporal comparison §7.2.3 steps 1–17.
    // https://tc39.es/proposal-temporal/#sec-temporal.duration.compare
    const left = toDurationFields(one),
      right = toDurationFields(two)
    const resolved = optionsObject(options)
    const relative = toRelativeTo(resolved.relativeTo)
    if (arrayEvery(durationFieldNames, field => left[field] === right[field]))
      return 0
    const native = nativeTemporal()
    if (import.meta.formatjsTemporalNativeData === true || native)
      return native!.compareDuration(left, right, relative)
    // Temporal comparison §7.2.3 step12: date components require both additions.
    if (
      relative &&
      'zoned' in relative &&
      (left.years ||
        left.months ||
        left.weeks ||
        left.days ||
        right.years ||
        right.months ||
        right.weeks ||
        right.days)
    ) {
      const a = relativeEndpoint(relative, left),
        b = relativeEndpoint(relative, right)
      return a < b ? -1 : a > b ? 1 : 0
    }
    // Temporal comparison §7.2.3 steps13–16 and §7.5.29: add only Y/M/W to dates.
    if (relative && 'date' in relative) {
      const value = (fields: DurationFields): bigint => {
        let days = fields.days
        if (fields.years || fields.months || fields.weeks) {
          const prefix = zeroDuration()
          prefix.years = fields.years
          prefix.months = fields.months
          prefix.weeks = fields.weeks
          // ECMA-262 preview §22.3.4.3 steps 1–7: count calendar units as days at the anchor.
          // https://tc39.es/ecma262/pr/3966/#sec-datedurationdays
          days +=
            addDate(relative.date, prefix, 'constrain') - relative.date.epochDay
        }
        const result =
          durationNanoseconds(fields, false) + bigIntFrom(days) * nsPerDay
        if (
          result <= -maxDurationNanoseconds ||
          result >= maxDurationNanoseconds
        )
          throw new RangeErrorConstructor('Duration out of range')
        return result
      }
      const a = value(left),
        b = value(right)
      return a < b ? -1 : a > b ? 1 : 0
    }
    if (
      left.years ||
      left.months ||
      left.weeks ||
      right.years ||
      right.months ||
      right.weeks
    )
      throw new RangeErrorConstructor('Calendar comparison requires relativeTo')
    const a = durationNanoseconds(left),
      b = durationNanoseconds(right)
    return a < b ? -1 : a > b ? 1 : 0
  }
  static from(value: unknown): DurationObject {
    // Temporal comparison §7.2.2 step 1.
    // https://tc39.es/proposal-temporal/#sec-temporal.duration.from
    if (import.meta.formatjsTemporalNativeData === true) {
      const fields = getSlot(value as object)
      if (fields) return createNativeDuration(fields)
      if (typeof value === 'string')
        return createNativeDuration(parseDurationString(value))
    }
    return createNativeDuration(toDurationFields(value))
  }
  get sign(): number {
    // Temporal comparison §7.3.13 steps 1–3.
    // https://tc39.es/proposal-temporal/#sec-get-temporal.duration.prototype.sign
    return durationSign(read(this))
  }
  get blank(): boolean {
    // Temporal comparison §7.3.14 steps 1–4.
    // https://tc39.es/proposal-temporal/#sec-get-temporal.duration.prototype.blank
    return durationSign(read(this)) === 0
  }
  with(fields: unknown): DurationObject {
    // Temporal comparison §7.3.15 steps 1–24.
    // https://tc39.es/proposal-temporal/#sec-temporal.duration.prototype.with
    const original = read(this)
    return createDuration({...original, ...partialDuration(fields)})
  }
  negated(): DurationObject {
    // Temporal comparison §7.3.16 steps 1–3.
    // https://tc39.es/proposal-temporal/#sec-temporal.duration.prototype.negated
    const fields = read(this)
    if (import.meta.formatjsTemporalNativeData === true)
      return createNativeDuration(
        nativeTemporal()!.transformDuration(fields, false)
      )
    const native = nativeTemporal()
    if (native) return createDuration(native.transformDuration(fields, false))
    // ECMA-262 preview §22.15.5.2 step 1: negate all components and canonicalize zero.
    // https://tc39.es/ecma262/pr/3966/#sec-createnegatedtemporalduration
    const result = zeroDuration()
    for (let i = 0; i < durationFieldNames.length; i++) {
      const key = durationFieldNames[i]
      result[key] = -fields[key] || 0
    }
    return createDuration(result)
  }
  abs(): DurationObject {
    // Temporal comparison §7.3.17 steps 1–3.
    // https://tc39.es/proposal-temporal/#sec-temporal.duration.prototype.abs
    const fields = read(this)
    if (import.meta.formatjsTemporalNativeData === true)
      return createNativeDuration(
        nativeTemporal()!.transformDuration(fields, true)
      )
    const native = nativeTemporal()
    if (native) return createDuration(native.transformDuration(fields, true))
    const result = zeroDuration()
    for (let i = 0; i < durationFieldNames.length; i++) {
      const key = durationFieldNames[i]
      result[key] = mathAbs(fields[key])
    }
    return createDuration(result)
  }
  add(other: unknown): DurationObject {
    // Temporal comparison §7.3.18 steps 1–3.
    // https://tc39.es/proposal-temporal/#sec-temporal.duration.prototype.add
    return addDurations(read(this), other, 1)
  }
  subtract(other: unknown): DurationObject {
    // Temporal comparison §7.3.19 steps 1–3.
    // https://tc39.es/proposal-temporal/#sec-temporal.duration.prototype.subtract
    return addDurations(read(this), other, -1)
  }
  round(roundTo: unknown): DurationObject {
    // Temporal comparison §7.3.20 steps 1–34.
    // https://tc39.es/proposal-temporal/#sec-temporal.duration.prototype.round
    const fields = read(this)
    if (roundTo === undefined)
      throw new TypeErrorConstructor('roundTo required')
    // ECMA-262 preview §22.15.3.20 steps 4–4.c: make an own smallestUnit
    // data property on a null-prototype options object for string shorthand.
    // https://tc39.es/ecma262/pr/3966/#sec-temporal.duration.prototype.round
    const resolved: Record<string, unknown> =
      typeof roundTo === 'string'
        ? unitOptions(roundTo)
        : optionsObject(roundTo)
    const largestRaw = resolved.largestUnit,
      largestText = largestRaw === undefined ? 'auto' : ToString(largestRaw)
    const largestOption =
      largestText === 'auto' ? undefined : unitOption(largestText)
    const relative = toRelativeTo(resolved.relativeTo),
      increment = roundingIncrement(resolved.roundingIncrement),
      mode = roundingMode(resolved.roundingMode, 'halfExpand'),
      smallestOption = unitOption(resolved.smallestUnit)
    if (largestRaw === undefined && smallestOption === undefined)
      throw new RangeErrorConstructor('Rounding unit required')
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
    const smallest = smallestOption ?? 'nanosecond',
      smallIndex = arrayIndexOf(units, smallest)
    const largest =
        largestOption ??
        units[mathMin(largestDurationField(fields), smallIndex)],
      largeIndex = arrayIndexOf(units, largest)
    if (largeIndex > smallIndex)
      throw new RangeErrorConstructor('Largest unit smaller than smallest unit')
    if (smallIndex > 3) {
      // ECMA-262 preview §22.3.13.3 steps 1–4: only clock units have a maximum.
      // https://tc39.es/ecma262/pr/3966/#sec-maximumtemporaldurationroundingincrement
      const maximum = [24, 60, 60, 1000, 1000, 1000][smallIndex - 4]
      // ECMA-262 preview §22.3.13.7 steps 2–4: require a divisor below the maximum.
      // https://tc39.es/ecma262/pr/3966/#sec-validatetemporalroundingincrement
      if (increment >= maximum || maximum % increment)
        throw new RangeErrorConstructor('Invalid rounding increment')
    }
    if (smallIndex < 4 && largeIndex < smallIndex && increment !== 1)
      throw new RangeErrorConstructor(
        'Calendar increment cannot balance to larger units'
      )
    if (relative)
      return createDuration(
        relativeRound(fields, relative, largest, smallest, increment, mode)
      )
    const native = nativeTemporal()
    if (import.meta.formatjsTemporalNativeData === true || native)
      return createDuration(
        native!.roundDuration(fields, largest, smallest, increment, mode)
      )
    if (fields.years || fields.months || fields.weeks || largeIndex < 3)
      throw new RangeErrorConstructor('Calendar rounding requires relativeTo')
    const quantum =
      smallest === 'day'
        ? 86_400_000_000_000n
        : timeUnitNanoseconds[smallest as TimeUnit]
    return createDuration(
      balanceDurationTime(
        roundDuration(
          durationNanoseconds(fields),
          bigIntFrom(increment) * quantum,
          mode
        ),
        largeIndex
      )
    )
  }
  total(options: unknown): number {
    // Temporal comparison §7.3.21 steps 1–15.
    // https://tc39.es/proposal-temporal/#sec-temporal.duration.prototype.total
    const fields = read(this)
    if (options === undefined)
      throw new TypeErrorConstructor('totalOf is required')
    // ECMA-262 preview §22.15.3.21 steps 4–4.c: make an own unit data
    // property on a null-prototype options object for string shorthand.
    // https://tc39.es/ecma262/pr/3966/#sec-temporal.duration.prototype.total
    const resolved =
      typeof options === 'string'
        ? unitOptions(options, 'unit')
        : optionsObject(options)
    const relative = toRelativeTo(resolved.relativeTo)
    const unit = unitOption(resolved.unit)
    if (unit === undefined) throw new RangeErrorConstructor('unit is required')
    if (relative) return relativeTotal(fields, relative, unit)
    const native = nativeTemporal()
    if (import.meta.formatjsTemporalNativeData === true || native)
      return native!.totalDuration(fields, unit)
    const factors: Record<string, bigint> = {
      day: 86_400_000_000_000n,
      hour: 3_600_000_000_000n,
      minute: 60_000_000_000n,
      second: 1_000_000_000n,
      millisecond: 1_000_000n,
      microsecond: 1000n,
      nanosecond: 1n,
    }
    if (
      !HasOwnProperty(factors, unit) ||
      fields.years ||
      fields.months ||
      fields.weeks
    )
      throw new RangeErrorConstructor('Calendar total requires relativeTo')
    return durationTotalNumber(durationNanoseconds(fields), factors[unit])
  }
  toString(options: unknown = undefined): string {
    // Temporal comparison §7.3.22 steps 1–18.
    // https://tc39.es/proposal-temporal/#sec-temporal.duration.prototype.tostring
    const fields = read(this),
      resolved = optionsObject(options)
    const digits = fractionalSecondDigits(resolved.fractionalSecondDigits)
    const mode = roundingMode(resolved.roundingMode, 'trunc')
    const unit = unitOption(resolved.smallestUnit)
    if (
      unit !== undefined &&
      !arrayIncludes(
        ['second', 'millisecond', 'microsecond', 'nanosecond'],
        unit
      )
    )
      throw new RangeErrorConstructor('Invalid duration string precision')
    const precision =
      unit === 'second'
        ? 0
        : unit === 'millisecond'
          ? 3
          : unit === 'microsecond'
            ? 6
            : unit === 'nanosecond'
              ? 9
              : digits
    const native = nativeTemporal()
    if (import.meta.formatjsTemporalNativeData === true || native)
      return native!.formatDuration(fields, precision, mode)
    if (precision === 'auto' || precision === 9)
      return formatDuration(fields, precision)
    // ECMA-262 preview §22.3.7.3 steps 1–3: retain date fields and round the clock span.
    // https://tc39.es/ecma262/pr/3966/#sec-tointernaldurationrecord
    const rounded = roundDuration(
      durationNanoseconds(fields, false),
      10n ** bigIntFrom(9 - precision),
      mode
    )
    const balanced = balanceDurationTime(
      rounded,
      mathMax(3, mathMin(largestDurationField(fields), 6))
    )
    balanced.years = fields.years
    balanced.months = fields.months
    balanced.weeks = fields.weeks
    balanced.days += fields.days
    return formatDuration(validateDuration(balanced), precision)
  }
  toLocaleString(
    locales: unknown = undefined,
    options: unknown = undefined
  ): string {
    // Temporal comparison §7.3.24 steps 1–3.
    // https://tc39.es/proposal-temporal/#sec-temporal.duration.prototype.tolocalestring
    const fields = read(this)
    return localeDuration(fields, locales, options, () =>
      formatDuration(fields)
    )
  }
  toJSON(): string {
    // Temporal comparison §7.3.23 steps 1–3.
    // https://tc39.es/proposal-temporal/#sec-temporal.duration.prototype.tojson
    return formatDuration(read(this))
  }
  valueOf(): never {
    // Temporal comparison §7.3.25 step 1.
    // https://tc39.es/proposal-temporal/#sec-temporal.duration.prototype.valueof
    throw new TypeErrorConstructor(
      'Cannot convert Temporal.Duration to primitive'
    )
  }
}
Object.defineProperty(DurationValue, 'name', {
  value: 'Duration',
  configurable: true,
})
// Temporal comparison §7.2.1.
// https://tc39.es/proposal-temporal/#sec-temporal.duration.prototype
// ECMA-262 preview §22.15.1: class target rejects calls and supports subclassing.
// https://tc39.es/ecma262/pr/3966/#sec-temporal-duration-constructor
// ECMA-262 preview §22.15.2: inherits Function.prototype.
// https://tc39.es/ecma262/pr/3966/#sec-properties-of-the-temporal-duration-constructor
export const Duration: DurationConstructor = createProxy(DurationValue, {
  construct(target, args, newTarget) {
    // Temporal comparison §7.1.1 steps 1–12.
    // https://tc39.es/proposal-temporal/#sec-temporal.duration
    const fields = zeroDuration()
    for (let i = 0; i < durationFieldNames.length; i++)
      fields[durationFieldNames[i]] =
        argumentAt(args, i) === undefined
          ? 0
          : integralDurationNumber(argumentAt(args, i))
    validateDuration(fields)
    const prototype = constructorPrototype(newTarget, target)
    const value = createObject(prototype)
    setSlot(value, fields)
    return value
  },
}) as unknown as DurationConstructor
// Temporal comparison §7.3.3 steps 1–3.
// https://tc39.es/proposal-temporal/#sec-get-temporal.duration.prototype.years
// Temporal comparison §7.3.4 steps 1–3.
// https://tc39.es/proposal-temporal/#sec-get-temporal.duration.prototype.months
// Temporal comparison §7.3.5 steps 1–3.
// https://tc39.es/proposal-temporal/#sec-get-temporal.duration.prototype.weeks
// Temporal comparison §7.3.6 steps 1–3.
// https://tc39.es/proposal-temporal/#sec-get-temporal.duration.prototype.days
// Temporal comparison §7.3.7 steps 1–3.
// https://tc39.es/proposal-temporal/#sec-get-temporal.duration.prototype.hours
// Temporal comparison §7.3.8 steps 1–3.
// https://tc39.es/proposal-temporal/#sec-get-temporal.duration.prototype.minutes
// Temporal comparison §7.3.9 steps 1–3.
// https://tc39.es/proposal-temporal/#sec-get-temporal.duration.prototype.seconds
// Temporal comparison §7.3.10 steps 1–3.
// https://tc39.es/proposal-temporal/#sec-get-temporal.duration.prototype.milliseconds
// Temporal comparison §7.3.11 steps 1–3.
// https://tc39.es/proposal-temporal/#sec-get-temporal.duration.prototype.microseconds
// Temporal comparison §7.3.12 steps 1–3.
// https://tc39.es/proposal-temporal/#sec-get-temporal.duration.prototype.nanoseconds
defineGetters(
  DurationValue.prototype,
  durationFieldNames,
  (receiver, field) => read(receiver)[field]
)
// ECMA-262 preview §22.15.3: ordinary prototype without instance slots.
// https://tc39.es/ecma262/pr/3966/#sec-properties-of-the-temporal-duration-prototype-object
Object.defineProperties(DurationValue.prototype, {
  // Temporal comparison §7.3.1.
  // https://tc39.es/proposal-temporal/#sec-temporal.duration.prototype.constructor
  constructor: {value: Duration, writable: true, configurable: true},
  // Temporal comparison §7.3.2.
  // https://tc39.es/proposal-temporal/#sec-temporal.duration.prototype-%symbol.tostringtag%
  [Symbol.toStringTag]: {value: 'Temporal.Duration', configurable: true},
})
