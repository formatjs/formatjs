import {defineGetters} from '#packages/temporal/accessors.js'
import {nativeTemporal} from '#packages/temporal/native.js'
import {localeDuration} from '#packages/temporal/locale.js'
import {formatDuration} from '#packages/temporal/duration-format.js'
import {ToString} from '#packages/ecma262-abstract/ToString.js'
import {
  toRelativeTo,
  relativeTotal,
  dateDurationDays,
  addDaysToDurationTime,
  relativeEndpoint,
  relativeRound,
} from '#packages/temporal/relative-duration.js'
import {
  durationFieldNames,
  durationFieldReadOrder,
  durationNanoseconds,
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
function read(value: unknown): DurationFields {
  const fields = getSlot(value as object)
  if (!fields) throw new TypeError('Invalid Duration receiver')
  return fields
}
export function toDurationFields(value: unknown): DurationFields {
  const existing = getSlot(value as object)
  if (existing) return {...existing}
  if (typeof value === 'string') return parseDurationString(value)
  return toNativeDurationFields(value)
}
/** @internal Validate before options getters; no-options operations defer to Rust. */
export function toNativeDurationFields(
  value: unknown,
  validate = true
): DurationFields {
  const existing = getSlot(value as object)
  if (existing) return existing
  if (typeof value === 'string') return parseDurationString(value)
  if (
    value === null ||
    (typeof value !== 'object' && typeof value !== 'function')
  )
    throw new TypeError('Duration fields must be an object')
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
  if (!found) throw new TypeError('Duration fields required')
  return validate ? validateDuration(fields) : fields
}
// Fields must already be normalized and validated.
export function createNativeDuration(fields: DurationFields): DurationObject {
  const value = Object.create(DurationValue.prototype) as DurationObject
  setSlot(value, fields)
  return value
}
export function createDuration(fields: DurationFields): DurationObject {
  const value = Object.create(DurationValue.prototype) as DurationObject
  setSlot(value, validateDuration({...fields}))
  return value
}
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
  const largest = Math.min(largestDurationField(one), largestDurationField(two))
  if (largest < 3)
    throw new RangeError('Calendar units cannot be added without a calendar')
  return createDuration(
    balanceDurationTime(
      durationNanoseconds(one) + BigInt(sign) * durationNanoseconds(two),
      largest
    )
  )
}

class DurationValue {
  constructor(..._values: unknown[]) {
    throw new TypeError('Use exported Duration constructor')
  }
  static compare(
    one: unknown,
    two: unknown,
    options: unknown = undefined
  ): -1 | 0 | 1 {
    // https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/duration.html#L85-L114
    // L85: convert one first; a throw prevents reading two.
    const left = toDurationFields(one)
    // L86: convert two.
    const right = toDurationFields(two)
    // L87: resolve options after both durations.
    const resolved = optionsObject(options)
    // L88: read relativeTo even if the duration fields match.
    const relative = toRelativeTo(resolved.relativeTo)
    // L89: equality here means all ten fields.
    if (durationFieldNames.every(field => left[field] === right[field]))
      // L90: equal fields skip endpoint arithmetic.
      return 0
    const native = nativeTemporal()
    if (import.meta.formatjsTemporalNativeData === true || native)
      return native!.compareDuration(left, right, relative)
    // L91: select the zoned anchor, if present.
    const zoned = relative && 'zoned' in relative ? relative : undefined
    // L92: plain and zoned anchors are mutually exclusive.
    const plain = relative && 'date' in relative ? relative.date : undefined
    // L93: first nonzero unit, in significance order.
    const largest1 = largestDurationField(left)
    // L94: likewise for two.
    const largest2 = largestDurationField(right)
    // L95: left's validated fields already represent its date and time parts.
    // L96: right uses the same representation.
    // L97: even identical nonzero date parts require both endpoint checks.
    if (zoned && (largest1 <= 3 || largest2 <= 3)) {
      // L98: the anchor carries its time zone.
      // L99: the anchor also carries its calendar.
      // L100: constrained addition can throw before the second addition.
      const a = relativeEndpoint(zoned, left)
      // L101: add two to the original anchor, not the first endpoint.
      const b = relativeEndpoint(zoned, right)
      // L102: later endpoint.
      if (a > b) return 1
      // L103: earlier endpoint.
      if (a < b) return -1
      // L104: same instant despite different fields.
      return 0
    }
    let days1: bigint, days2: bigint
    // L105: years, months and weeks need calendar arithmetic.
    if (largest1 < 3 || largest2 < 3) {
      // L106: no implicit reference date.
      if (!plain)
        throw new RangeError('Calendar comparison requires relativeTo')
      // L107: calendar addition for one may throw.
      days1 = dateDurationDays(plain, left)
      // L108: convert two before adding either time part.
      days2 = dateDurationDays(plain, right)
    } else {
      // L109: no calendar units; ignore the plain anchor.
      // L110: take one's days unchanged.
      days1 = BigInt(left.days)
      // L111: take two's days unchanged.
      days2 = BigInt(right.days)
    }
    // L112: treat each day as exactly 24 hours.
    const a = addDaysToDurationTime(left, days1)
    // L113: enforce the same time-duration bound on two.
    const b = addDaysToDurationTime(right, days2)
    // L114: compare exact nanoseconds, not floating-point totals.
    return a < b ? -1 : a > b ? 1 : 0
  }
  static from(value: unknown): DurationObject {
    if (import.meta.formatjsTemporalNativeData === true) {
      const fields = getSlot(value as object)
      if (fields) return createNativeDuration(fields)
      if (typeof value === 'string')
        return createNativeDuration(parseDurationString(value))
    }
    return createNativeDuration(toDurationFields(value))
  }
  get sign(): number {
    return durationSign(read(this))
  }
  get blank(): boolean {
    return durationSign(read(this)) === 0
  }
  with(fields: unknown): DurationObject {
    const original = read(this)
    return createDuration({...original, ...partialDuration(fields)})
  }
  negated(): DurationObject {
    const fields = read(this)
    if (import.meta.formatjsTemporalNativeData === true)
      return createNativeDuration(
        nativeTemporal()!.transformDuration(fields, false)
      )
    const native = nativeTemporal()
    if (native) return createDuration(native.transformDuration(fields, false))
    const result = zeroDuration()
    for (let i = 0; i < durationFieldNames.length; i++) {
      const key = durationFieldNames[i]
      result[key] = -fields[key] || 0
    }
    return createDuration(result)
  }
  abs(): DurationObject {
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
      result[key] = Math.abs(fields[key])
    }
    return createDuration(result)
  }
  add(other: unknown): DurationObject {
    return addDurations(read(this), other, 1)
  }
  subtract(other: unknown): DurationObject {
    return addDurations(read(this), other, -1)
  }
  round(roundTo: unknown): DurationObject {
    const fields = read(this)
    if (roundTo === undefined) throw new TypeError('roundTo required')
    const resolved: Record<string, unknown> =
      typeof roundTo === 'string'
        ? Object.assign(Object.create(null), {smallestUnit: roundTo})
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
      throw new RangeError('Rounding unit required')
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
      smallIndex = units.indexOf(smallest)
    const largest =
        largestOption ??
        units[Math.min(largestDurationField(fields), smallIndex)],
      largeIndex = units.indexOf(largest)
    if (largeIndex > smallIndex)
      throw new RangeError('Largest unit smaller than smallest unit')
    if (smallIndex > 3) {
      const maximum = [24, 60, 60, 1000, 1000, 1000][smallIndex - 4]
      if (increment >= maximum || maximum % increment)
        throw new RangeError('Invalid rounding increment')
    }
    if (smallIndex < 4 && largeIndex < smallIndex && increment !== 1)
      throw new RangeError('Calendar increment cannot balance to larger units')
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
      throw new RangeError('Calendar rounding requires relativeTo')
    const quantum =
      smallest === 'day'
        ? 86_400_000_000_000n
        : timeUnitNanoseconds[smallest as TimeUnit]
    return createDuration(
      balanceDurationTime(
        roundDuration(
          durationNanoseconds(fields),
          BigInt(increment) * quantum,
          mode
        ),
        largeIndex
      )
    )
  }
  total(options: unknown): number {
    const fields = read(this)
    if (options === undefined) throw new TypeError('totalOf is required')
    const resolved =
      typeof options === 'string'
        ? Object.assign(Object.create(null), {unit: options})
        : optionsObject(options)
    const relative = toRelativeTo(resolved.relativeTo)
    const unit = unitOption(resolved.unit)
    if (unit === undefined) throw new RangeError('unit is required')
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
      !Object.hasOwn(factors, unit) ||
      fields.years ||
      fields.months ||
      fields.weeks
    )
      throw new RangeError('Calendar total requires relativeTo')
    return durationTotalNumber(durationNanoseconds(fields), factors[unit])
  }
  toString(options: unknown = undefined): string {
    const fields = read(this),
      resolved = optionsObject(options)
    const digits = fractionalSecondDigits(resolved.fractionalSecondDigits)
    const mode = roundingMode(resolved.roundingMode, 'trunc')
    const unit = unitOption(resolved.smallestUnit)
    if (
      unit !== undefined &&
      !['second', 'millisecond', 'microsecond', 'nanosecond'].includes(unit)
    )
      throw new RangeError('Invalid duration string precision')
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
    const rounded = roundDuration(
      durationNanoseconds(fields, false),
      10n ** BigInt(9 - precision),
      mode
    )
    const balanced = balanceDurationTime(
      rounded,
      Math.max(3, Math.min(largestDurationField(fields), 6))
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
    const fields = read(this)
    return localeDuration(fields, locales, options, () =>
      formatDuration(fields)
    )
  }
  toJSON(): string {
    return formatDuration(read(this))
  }
  valueOf(): never {
    throw new TypeError('Cannot convert Temporal.Duration to primitive')
  }
}
Object.defineProperty(DurationValue, 'name', {
  value: 'Duration',
  configurable: true,
})
export const Duration: DurationConstructor = new Proxy(DurationValue, {
  construct(target, args, newTarget) {
    const fields = zeroDuration()
    for (let i = 0; i < durationFieldNames.length; i++)
      fields[durationFieldNames[i]] =
        args[i] === undefined ? 0 : integralDurationNumber(args[i])
    validateDuration(fields)
    const prototype = Reflect.get(newTarget, 'prototype')
    const value = Object.create(
      prototype !== null &&
        (typeof prototype === 'object' || typeof prototype === 'function')
        ? prototype
        : target.prototype
    )
    setSlot(value, fields)
    return value
  },
}) as unknown as DurationConstructor
defineGetters(
  DurationValue.prototype,
  durationFieldNames,
  (receiver, field) => read(receiver)[field]
)
Object.defineProperties(DurationValue.prototype, {
  constructor: {value: Duration, writable: true, configurable: true},
  [Symbol.toStringTag]: {value: 'Temporal.Duration', configurable: true},
})
