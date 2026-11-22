import {ToString} from '#packages/ecma262-abstract/ToString.js'
import {formatFractionalSeconds} from '#packages/temporal/format-digits.js'
import {
  RangeErrorConstructor,
  TypeErrorConstructor,
  arrayIndexOf,
  bigIntFrom,
  floor,
  mathMax,
  mathMin,
  mathTrunc,
  numberFrom,
  numberIsInteger,
} from '#packages/ecma262-abstract/intrinsics.js'
import {IsObject} from '#packages/ecma262-abstract/IsObject.js'
import {
  argumentAt,
  constructorPrototype,
  createObject,
  createProxy,
} from '#packages/temporal/intrinsics.js'
import {defineGetters} from '#packages/temporal/accessors.js'
import {localeDateTime} from '#packages/temporal/locale.js'
import {
  nativeTemporal,
  type NativeTimeResult,
} from '#packages/temporal/native.js'
import {
  getTimeSlot as getSlot,
  getNativeTimeSlot,
  setNativeTimeSlot,
  setTimeSlot as setSlot,
  getDateTimeSlot,
  getZonedDateTimeSlot,
  getZonedSlot,
  getDateSlot,
  getYearMonthSlot,
  getMonthDaySlot,
} from '#packages/temporal/plain-slots.js'
import {parsePlainTimeString} from '#packages/temporal/instant-string.js'
import {
  createDuration,
  createNativeDuration,
  toDurationFields,
  toNativeDurationFields,
  type DurationObject,
} from '#packages/temporal/duration.js'
import {
  durationNanoseconds,
  balanceDurationTime,
} from '#packages/temporal/duration-core.js'
import {
  optionsObject,
  unitOptions,
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
const factors = clockValues(index => timeUnitNanoseconds[names[index]])
const fieldOrder = [0, 4, 3, 1, 5, 2]
const maxima = [24, 60, 60, 1000, 1000, 1000]
const day = 86_400_000_000_000n
function read(value: unknown): bigint {
  const result = getSlot(value as object)
  if (result === undefined)
    throw new TypeErrorConstructor('Invalid PlainTime receiver')
  return result
}
// A private six-field list must not consult array iterators, methods or species.
function clockValues<T>(read: (index: number) => T): T[] {
  return [read(0), read(1), read(2), read(3), read(4), read(5)]
}
function fields(value: bigint): number[] {
  return clockValues(index =>
    numberFrom((value / factors[index]) % bigIntFrom(maxima[index]))
  )
}
function integer(value: unknown): number {
  // https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/abstractops.html#L1796-L1798
  // L1796: unary + performs ToNumber, preserving user coercion and throws.
  // L1798: captured truncation is unobservable; finite inputs become integers.
  const result = mathTrunc(+(value as number))
  // L1797: truncation leaves NaN/infinities nonintegral; reject with intrinsic RangeError.
  if (!numberIsInteger(result))
    throw new RangeErrorConstructor('Time field must be finite')
  // L1798: mathematical zero has no negative sign.
  return result || 0
}
function overflow(options: unknown): boolean {
  const raw = optionsObject(options).overflow
  const value = raw === undefined ? 'constrain' : ToString(raw)
  if (value !== 'constrain' && value !== 'reject')
    throw new RangeErrorConstructor('Invalid overflow')
  return value === 'constrain'
}
function regulate(values: number[], constrain: boolean): bigint {
  const native = nativeTemporal()
  if (import.meta.formatjsTemporalNativeData === true || native)
    return native!.regulatePlainTime(values, constrain)
  let result = 0n
  // https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaintime.html#L622-L632
  // L622: the validated overflow choice selects independent field clamping.
  // L623: index 0 clamps hour to 0..23.
  // L624: index 1 clamps minute to 0..59.
  // L625: index 2 clamps second to 0..59.
  // L626: index 3 clamps millisecond to 0..999.
  // L627: index 4 clamps microsecond to 0..999.
  // L628: index 5 clamps nanosecond to 0..999.
  // L629: the other mode leaves each integer field unchanged.
  // L630: the other validated mode is reject.
  // L631: any unchanged field outside its bounds throws RangeError.
  // https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaintime.html#L655-L661
  // L655: index 0 rejects an hour outside 0..23.
  // L656: index 1 rejects a minute outside 0..59.
  // L657: index 2 rejects a second outside 0..59.
  // L658: index 3 rejects a millisecond outside 0..999.
  // L659: index 4 rejects a microsecond outside 0..999.
  // L660: index 5 rejects a nanosecond outside 0..999.
  for (let index = 0; index < 6; index++) {
    let value = values[index]
    if (constrain) value = mathMax(0, mathMin(maxima[index] - 1, value))
    if (value < 0 || value >= maxima[index])
      throw new RangeErrorConstructor('Time out of range')
    result += bigIntFrom(value) * factors[index]
  }
  // L661: every field passed; the IsValidTime predicate is true.
  // https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaintime.html#L632
  // L632: exact within-day nanoseconds encode all six fields with implicit Days 0.
  return result
}
function object(value: unknown): value is Record<string, unknown> {
  return IsObject(value)
}
function timeFields(
  item: Record<string, unknown>,
  initial = [0, 0, 0, 0, 0, 0]
): number[] {
  const result = clockValues(index => initial[index])
  // ToTemporalTimeRecord: complete callers seed zero; with() fuses the later merge.
  // The partial-record unset/undefined conflict remains in the separate spec-issue log.
  // https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaintime.html#L733-L758
  // L733: no defined field has been converted yet.
  let any = false
  for (let position = 0; position < 6; position++) {
    const index = fieldOrder[position]
    // L734/L738/L742/L746/L750/L754: one Get, in hour/microsecond/millisecond/minute/nanosecond/second order.
    const raw = item[names[index]]
    // L735/L739/L743/L747/L751/L755: undefined alone means absent; preserve the seed.
    if (raw !== undefined) {
      // L736/L740/L744/L748/L752/L756: convert before reading the next field; propagate throws.
      result[index] = integer(raw)
      // L737/L741/L745/L749/L753/L757: even a converted zero counts as a supplied field.
      any = true
    }
  }
  // L758: finish all six Gets before rejecting a record with no supplied fields.
  if (!any) throw new TypeErrorConstructor('At least one time field required')
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
    throw new TypeErrorConstructor('Expected time string or object')
  const result = parsePlainTimeString(value)
  overflow(options)
  return result
}
export function toPlainTimeNanoseconds(value: unknown): bigint {
  // Temporal comparison §4.5.6: reuse internal conversion in both backends.
  return import.meta.formatjsTemporalNativeData === true
    ? bigIntFrom(toNativeTime(value).nanoseconds)
    : toTime(value)
}
function nativeTime(value: object): NativeTimeResult {
  const result = getNativeTimeSlot(value)
  if (!result) throw new TypeErrorConstructor('Invalid PlainTime receiver')
  return result
}
function nativeTimeFromValue(value: bigint): NativeTimeResult {
  return nativeTemporal()!.roundPlainTimeResult(
    ((value % day) + day) % day,
    'nanosecond',
    1,
    'trunc'
  )
}
function toNativeTime(value: unknown, options?: unknown): NativeTimeResult {
  const existing = getNativeTimeSlot(value as object)
  if (existing !== undefined) {
    overflow(options)
    return existing
  }
  const datetime =
    getDateTimeSlot(value as object) ?? getZonedDateTimeSlot(value as object)
  if (datetime) {
    overflow(options)
    return nativeTimeFromValue(datetime.epochNanoseconds)
  }
  if (object(value)) {
    const values = timeFields(value)
    return nativeTemporal()!.regulatePlainTimeResult(values, overflow(options))
  }
  if (typeof value !== 'string')
    throw new TypeErrorConstructor('Expected time string or object')
  const result = nativeTemporal()!.parsePlainTimeResult(value)
  overflow(options)
  return result
}
function create(value: bigint | NativeTimeResult): PlainTimeObject {
  if (import.meta.formatjsTemporalNativeData === true) {
    const data = typeof value === 'bigint' ? nativeTimeFromValue(value) : value
    const result = createObject(PlainTimeValue.prototype) as PlainTimeObject
    setNativeTimeSlot(result, data)
    return result
  }
  const result = createObject(PlainTimeValue.prototype) as PlainTimeObject
  setSlot(result, (((value as bigint) % day) + day) % day)
  return result
}
export function createPlainTime(value: bigint): PlainTimeObject {
  return create(value)
}
export function validateTimeIncrement(unit: TimeUnit, increment: number): void {
  // https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/abstractops.html#L430-L437
  // L432-L434: all six L722 maxima exceed one; strict cap is dividend - 1.
  // L435-L437: positive integer input must fit that cap and divide the dividend.
  const maximum = maxima[arrayIndexOf(names, unit)]
  if (increment >= maximum || maximum % increment !== 0)
    throw new RangeErrorConstructor('Invalid time rounding increment')
}
export function roundTime(
  value: bigint,
  unit: TimeUnit,
  increment: number,
  mode: RoundingMode
): bigint {
  validateTimeIncrement(unit, increment)
  const native = nativeTemporal()
  if (import.meta.formatjsTemporalNativeData === true || native)
    return native!.roundPlainTime(value, unit, increment, mode)
  const index = arrayIndexOf(names, unit)
  const parent = index === 0 ? day : factors[index - 1]
  const base = (value / parent) * parent
  return (
    base +
    roundInstant(value - base, factors[index] * bigIntFrom(increment), mode)
  )
}
function difference(
  value: bigint | number,
  other: unknown,
  options: unknown,
  since: boolean
): DurationObject {
  const end =
    import.meta.formatjsTemporalNativeData === true
      ? toNativeTime(other).nanoseconds
      : toTime(other)
  const resolved = optionsObject(options)
  const largestRaw = resolved.largestUnit
  const largestString = largestRaw === undefined ? 'auto' : ToString(largestRaw)
  const largest =
    largestString === 'auto' ? undefined : unitOption(largestString)
  const increment = roundingIncrement(resolved.roundingIncrement)
  const mode = roundingMode(resolved.roundingMode, 'trunc')
  const smallest = timeUnit(unitOption(resolved.smallestUnit) ?? 'nanosecond')
  const smallIndex = arrayIndexOf(names, smallest),
    largeIndex = arrayIndexOf(names, timeUnit(largest ?? 'hour'))
  if (largeIndex > smallIndex)
    throw new RangeErrorConstructor('Largest unit smaller than smallest unit')
  validateTimeIncrement(smallest, increment)
  const native = nativeTemporal()
  if (import.meta.formatjsTemporalNativeData === true)
    return createNativeDuration(
      native!.differencePlainTime(
        (since ? end : value) as bigint,
        (since ? value : end) as bigint,
        names[largeIndex],
        smallest,
        increment,
        mode
      )
    )
  if (native)
    return createDuration(
      native.differencePlainTime(
        (since ? end : value) as bigint,
        (since ? value : end) as bigint,
        names[largeIndex],
        smallest,
        increment,
        mode
      )
    )
  // https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaintime.html#L529-L537
  // L529: subtract encoded hour contributions.
  // L530: subtract encoded minute contributions.
  // L531: subtract encoded second contributions.
  // L532: subtract encoded millisecond contributions.
  // L533: subtract encoded microsecond contributions.
  // L534: subtract encoded nanosecond contributions.
  // L535: linearity makes their weighted sum equal end minus value.
  // L536: both clocks lie in [0, day), so their difference has magnitude below day.
  // L537: pass that exact duration onward; since uses the reversed operand order.
  return createDuration(
    balanceDurationTime(
      roundDuration(
        ((end as bigint) - (value as bigint)) * (since ? -1n : 1n),
        factors[smallIndex] * bigIntFrom(increment),
        mode
      ),
      largeIndex + 4
    )
  )
}
function add(
  value: bigint | number,
  other: unknown,
  sign: bigint
): PlainTimeObject {
  const duration =
    import.meta.formatjsTemporalNativeData === true
      ? toNativeDurationFields(other, false)
      : toDurationFields(other)
  const native = nativeTemporal()
  if (import.meta.formatjsTemporalNativeData === true)
    return create(native!.addPlainTimeResult(value, duration, sign < 0n))
  if (native)
    return create(native.addPlainTime(value as bigint, duration, sign < 0n))
  return create((value as bigint) + sign * durationNanoseconds(duration, false))
}
function format(
  value: bigint | number,
  precision: Precision = 'auto',
  mode: RoundingMode = 'trunc'
): string {
  const native = nativeTemporal()
  if (import.meta.formatjsTemporalNativeData === true || native)
    return native!.formatPlainTime(value, precision, mode)
  const quantum =
    precision === 'auto'
      ? 1n
      : precision === 'minute'
        ? factors[1]
        : 10n ** bigIntFrom(9 - precision)
  // One day's nanoseconds fit exactly in a Number.
  let remaining = numberFrom(
    quantum === 1n
      ? (value as bigint)
      : roundInstant(value as bigint, quantum, mode) % day
  )
  const hour = floor(remaining / 3_600_000_000_000)
  remaining %= 3_600_000_000_000
  const minute = floor(remaining / 60_000_000_000)
  remaining %= 60_000_000_000
  const pad = (part: number): string =>
    part < 10 ? '0' + part : ToString(part)
  let result = pad(hour) + ':' + pad(minute)
  if (precision !== 'minute') {
    result += ':' + pad(floor(remaining / 1_000_000_000))
    result += formatFractionalSeconds(remaining % 1_000_000_000, precision)
  }
  return result
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
    throw new TypeErrorConstructor('Use exported PlainTime constructor')
  }
  declare readonly hour: number
  declare readonly minute: number
  declare readonly second: number
  declare readonly millisecond: number
  declare readonly microsecond: number
  declare readonly nanosecond: number
  static from(item: unknown, options: unknown = undefined): PlainTimeObject {
    // Temporal comparison §4.2.2 step 1.
    // https://tc39.es/proposal-temporal/#sec-temporal.plaintime.from
    if (import.meta.formatjsTemporalNativeData === true)
      return create(toNativeTime(item, options))
    return create(toTime(item, options))
  }
  static compare(one: unknown, two: unknown): -1 | 0 | 1 {
    // Temporal comparison §4.2.3 steps 1–3.
    // https://tc39.es/proposal-temporal/#sec-temporal.plaintime.compare
    // https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaintime.html#L833-L845
    // L833: a greater hour dominates every lower clock field.
    // L834: a lesser hour dominates every lower clock field.
    // L835: with equal hours, a greater minute gives greater nanoseconds.
    // L836: with equal hours, a lesser minute gives lesser nanoseconds.
    // L837: with equal hours/minutes, a greater second gives greater nanoseconds.
    // L838: with equal hours/minutes, a lesser second gives lesser nanoseconds.
    // L839: with equal higher fields, greater milliseconds give greater nanoseconds.
    // L840: with equal higher fields, lesser milliseconds give lesser nanoseconds.
    // L841: with equal higher fields, greater microseconds give greater nanoseconds.
    // L842: with equal higher fields, lesser microseconds give lesser nanoseconds.
    // L843: with equal higher fields, greater nanoseconds compare greater.
    // L844: with equal higher fields, lesser nanoseconds compare lesser.
    // L845: equal clock totals identify all six normalized clock fields.
    // https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaintime.html#L75
    // L75: both backends compare normalized private clocks and return a Number sign.
    if (import.meta.formatjsTemporalNativeData === true) {
      const left = toNativeTime(one).nanoseconds,
        right = toNativeTime(two).nanoseconds
      return left < right ? -1 : left > right ? 1 : 0
    }
    const left = toTime(one),
      right = toTime(two)
    return left < right ? -1 : left > right ? 1 : 0
  }
  with(item: unknown, options: unknown = undefined): PlainTimeObject {
    // Temporal comparison §4.3.11 steps 1–20.
    // https://tc39.es/proposal-temporal/#sec-temporal.plaintime.prototype.with
    const value =
      import.meta.formatjsTemporalNativeData === true
        ? nativeTime(this).nanoseconds
        : read(this)
    if (
      !object(item) ||
      getSlot(item) !== undefined ||
      getDateTimeSlot(item) ||
      getZonedSlot(item) ||
      getDateSlot(item) ||
      getYearMonthSlot(item) ||
      getMonthDaySlot(item)
    )
      throw new TypeErrorConstructor('Expected partial time object')
    if (item.calendar !== undefined || item.timeZone !== undefined)
      throw new TypeErrorConstructor('Unexpected calendar or timeZone')
    const values = timeFields(
      item,
      import.meta.formatjsTemporalNativeData === true
        ? nativeTime(this).fields
        : fields(value as bigint)
    )
    if (import.meta.formatjsTemporalNativeData === true)
      return create(
        nativeTemporal()!.regulatePlainTimeResult(values, overflow(options))
      )
    return create(regulate(values, overflow(options)))
  }
  add(duration: unknown): PlainTimeObject {
    // Temporal comparison §4.3.9 steps 1–3.
    // https://tc39.es/proposal-temporal/#sec-temporal.plaintime.prototype.add
    return add(
      import.meta.formatjsTemporalNativeData === true
        ? nativeTime(this).nanoseconds
        : read(this),
      duration,
      1n
    )
  }
  subtract(duration: unknown): PlainTimeObject {
    // Temporal comparison §4.3.10 steps 1–3.
    // https://tc39.es/proposal-temporal/#sec-temporal.plaintime.prototype.subtract
    return add(
      import.meta.formatjsTemporalNativeData === true
        ? nativeTime(this).nanoseconds
        : read(this),
      duration,
      -1n
    )
  }
  until(other: unknown, options: unknown = undefined): DurationObject {
    // Temporal comparison §4.3.12 steps 1–3.
    // https://tc39.es/proposal-temporal/#sec-temporal.plaintime.prototype.until
    return difference(
      import.meta.formatjsTemporalNativeData === true
        ? nativeTime(this).nanoseconds
        : read(this),
      other,
      options,
      false
    )
  }
  since(other: unknown, options: unknown = undefined): DurationObject {
    // Temporal comparison §4.3.13 steps 1–3.
    // https://tc39.es/proposal-temporal/#sec-temporal.plaintime.prototype.since
    return difference(
      import.meta.formatjsTemporalNativeData === true
        ? nativeTime(this).nanoseconds
        : read(this),
      other,
      options,
      true
    )
  }
  equals(other: unknown): boolean {
    // Temporal comparison §4.3.15 steps 1–5.
    // https://tc39.es/proposal-temporal/#sec-temporal.plaintime.prototype.equals
    if (import.meta.formatjsTemporalNativeData === true)
      return nativeTime(this).nanoseconds === toNativeTime(other).nanoseconds
    return read(this) === toTime(other)
  }
  round(roundTo: unknown): PlainTimeObject {
    // Temporal comparison §4.3.14 steps 1–15.
    // https://tc39.es/proposal-temporal/#sec-temporal.plaintime.prototype.round
    const value =
      import.meta.formatjsTemporalNativeData === true
        ? nativeTime(this).nanoseconds
        : read(this)
    if (roundTo === undefined)
      throw new TypeErrorConstructor('roundTo required')
    // https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaintime.html#L265-L268
    // L265: select string shorthand; L266: retain the primitive unit string.
    // L267: create a null-prototype record; L268: create its own smallestUnit data property.
    const resolved: Record<string, unknown> =
      typeof roundTo === 'string'
        ? unitOptions(roundTo)
        : optionsObject(roundTo)
    const increment = roundingIncrement(resolved.roundingIncrement)
    const mode = roundingMode(resolved.roundingMode, 'halfExpand')
    const unit = timeUnit(unitOption(resolved.smallestUnit))
    if (import.meta.formatjsTemporalNativeData === true)
      return create(
        nativeTemporal()!.roundPlainTimeResult(value, unit, increment, mode)
      )
    return create(roundTime(value as bigint, unit, increment, mode))
  }
  toString(options: unknown = undefined): string {
    // Temporal comparison §4.3.16 steps 1–12.
    // https://tc39.es/proposal-temporal/#sec-temporal.plaintime.prototype.tostring
    const value =
        import.meta.formatjsTemporalNativeData === true
          ? nativeTime(this).nanoseconds
          : read(this),
      resolved = optionsObject(options)
    const digits = fractionalSecondDigits(resolved.fractionalSecondDigits)
    const mode = roundingMode(resolved.roundingMode, 'trunc')
    const raw = unitOption(resolved.smallestUnit)
    if (raw !== undefined && timeUnit(raw) === 'hour')
      throw new RangeErrorConstructor('Cannot format hours only')
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
    // Temporal comparison §4.3.17 steps 1–3.
    // https://tc39.es/proposal-temporal/#sec-temporal.plaintime.prototype.tolocalestring
    const slot = read(this)
    return localeDateTime(
      {kind: 'PlainTime', epochNanoseconds: slot},
      locales,
      options,
      () => localeStringIntrinsic.call(this)
    )
  }
  toJSON(): string {
    // Temporal comparison §4.3.18 steps 1–3.
    // https://tc39.es/proposal-temporal/#sec-temporal.plaintime.prototype.tojson
    return format(
      import.meta.formatjsTemporalNativeData === true
        ? nativeTime(this).nanoseconds
        : read(this)
    )
  }
  valueOf(): never {
    // Temporal comparison §4.3.19 step 1.
    // https://tc39.es/proposal-temporal/#sec-temporal.plaintime.prototype.valueof
    throw new TypeErrorConstructor(
      'Cannot convert Temporal.PlainTime to primitive'
    )
  }
}
const localeStringIntrinsic = PlainTimeValue.prototype.toString

Object.defineProperty(PlainTimeValue, 'name', {
  value: 'PlainTime',
  configurable: true,
})
// Temporal comparison §4.2.1.
// https://tc39.es/proposal-temporal/#sec-temporal.plaintime.prototype
export const PlainTime: PlainTimeConstructor = createProxy(PlainTimeValue, {
  construct(target, args, newTarget) {
    // Temporal comparison §4.1.1 steps 1–10.
    // https://tc39.es/proposal-temporal/#sec-temporal.plaintime
    const values = clockValues(index =>
      argumentAt(args, index) === undefined
        ? 0
        : integer(argumentAt(args, index))
    )
    if (import.meta.formatjsTemporalNativeData === true) {
      const value = nativeTemporal()!.regulatePlainTimeResult(values, false)
      const prototype = constructorPrototype(newTarget, target)
      const result = createObject(prototype)
      setNativeTimeSlot(result, value)
      return result
    }
    const value = regulate(values, false)
    const prototype = constructorPrototype(newTarget, target)
    const result = createObject(prototype)
    setSlot(result, value)
    return result
  },
})
Object.defineProperties(PlainTimeValue.prototype, {
  // Temporal comparison §4.3.1.
  // https://tc39.es/proposal-temporal/#sec-temporal.plaintime.prototype.constructor
  constructor: {value: PlainTime, writable: true, configurable: true},
  // Temporal comparison §4.3.2.
  // https://tc39.es/proposal-temporal/#sec-temporal.plaintime.prototype-%symbol.tostringtag%
  [Symbol.toStringTag]: {value: 'Temporal.PlainTime', configurable: true},
})
// Temporal comparison §4.3.3 steps 1–3.
// https://tc39.es/proposal-temporal/#sec-get-temporal.plaintime.prototype.hour
// Temporal comparison §4.3.4 steps 1–3.
// https://tc39.es/proposal-temporal/#sec-get-temporal.plaintime.prototype.minute
// Temporal comparison §4.3.5 steps 1–3.
// https://tc39.es/proposal-temporal/#sec-get-temporal.plaintime.prototype.second
// Temporal comparison §4.3.6 steps 1–3.
// https://tc39.es/proposal-temporal/#sec-get-temporal.plaintime.prototype.millisecond
// Temporal comparison §4.3.7 steps 1–3.
// https://tc39.es/proposal-temporal/#sec-get-temporal.plaintime.prototype.microsecond
// Temporal comparison §4.3.8 steps 1–3.
// https://tc39.es/proposal-temporal/#sec-get-temporal.plaintime.prototype.nanosecond
defineGetters(PlainTimeValue.prototype, names, (receiver, _name, index) =>
  import.meta.formatjsTemporalNativeData === true
    ? nativeTime(receiver as object).fields[index]
    : fields(read(receiver))[index]
)
