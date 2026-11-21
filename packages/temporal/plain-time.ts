import {
  RangeErrorConstructor,
  TypeErrorConstructor,
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
  createObject,
  createProxy,
} from '#packages/temporal/intrinsics.js'
import {defineGetters} from '#packages/temporal/accessors.js'
import {localeDateTime} from '#packages/temporal/locale.js'
import {
  nativeTemporal,
  type NativeTimeResult,
} from '#packages/temporal/native.js'
import {ToString} from '#packages/ecma262-abstract/ToString.js'
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
  if (result === undefined)
    throw new TypeErrorConstructor('Invalid PlainTime receiver')
  return result
}
function fields(value: bigint): number[] {
  return factors.map((factor, index) =>
    numberFrom((value / factor) % bigIntFrom(maxima[index]))
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
  for (let index = 0; index < 6; index++) {
    let value = values[index]
    if (constrain) value = mathMax(0, mathMin(maxima[index] - 1, value))
    if (value < 0 || value >= maxima[index])
      throw new RangeErrorConstructor('Time out of range')
    result += bigIntFrom(value) * factors[index]
  }
  return result
}
function object(value: unknown): value is Record<string, unknown> {
  return IsObject(value)
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
function validateIncrement(unit: TimeUnit, increment: number): void {
  const maximum = maxima[names.indexOf(unit)]
  if (increment >= maximum || maximum % increment !== 0)
    throw new RangeErrorConstructor('Invalid time rounding increment')
}
export function roundTime(
  value: bigint,
  unit: TimeUnit,
  increment: number,
  mode: RoundingMode
): bigint {
  validateIncrement(unit, increment)
  const native = nativeTemporal()
  if (import.meta.formatjsTemporalNativeData === true || native)
    return native!.roundPlainTime(value, unit, increment, mode)
  const index = names.indexOf(unit)
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
  const smallIndex = names.indexOf(smallest),
    largeIndex = names.indexOf(timeUnit(largest ?? 'hour'))
  if (largeIndex > smallIndex)
    throw new RangeErrorConstructor('Largest unit smaller than smallest unit')
  validateIncrement(smallest, increment)
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
  const pad = (part: number): string => (part < 10 ? '0' + part : String(part))
  let result = pad(hour) + ':' + pad(minute)
  if (precision !== 'minute') {
    result += ':' + pad(floor(remaining / 1_000_000_000))
    const digits = String(remaining % 1_000_000_000).padStart(9, '0')
    const fraction =
      precision === 'auto'
        ? digits.replace(/0+$/, '')
        : digits.slice(0, precision)
    if (fraction) result += '.' + fraction
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
    if (import.meta.formatjsTemporalNativeData === true)
      return create(toNativeTime(item, options))
    return create(toTime(item, options))
  }
  static compare(one: unknown, two: unknown): -1 | 0 | 1 {
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
    return add(
      import.meta.formatjsTemporalNativeData === true
        ? nativeTime(this).nanoseconds
        : read(this),
      duration,
      1n
    )
  }
  subtract(duration: unknown): PlainTimeObject {
    return add(
      import.meta.formatjsTemporalNativeData === true
        ? nativeTime(this).nanoseconds
        : read(this),
      duration,
      -1n
    )
  }
  until(other: unknown, options: unknown = undefined): DurationObject {
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
    if (import.meta.formatjsTemporalNativeData === true)
      return nativeTime(this).nanoseconds === toNativeTime(other).nanoseconds
    return read(this) === toTime(other)
  }
  round(roundTo: unknown): PlainTimeObject {
    const value =
      import.meta.formatjsTemporalNativeData === true
        ? nativeTime(this).nanoseconds
        : read(this)
    if (roundTo === undefined)
      throw new TypeErrorConstructor('roundTo required')
    const resolved: Record<string, unknown> =
      typeof roundTo === 'string'
        ? Object.assign(createObject(null), {smallestUnit: roundTo})
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
    const slot = read(this)
    return localeDateTime(
      {kind: 'PlainTime', epochNanoseconds: slot},
      locales,
      options,
      () => localeStringIntrinsic.call(this)
    )
  }
  toJSON(): string {
    return format(
      import.meta.formatjsTemporalNativeData === true
        ? nativeTime(this).nanoseconds
        : read(this)
    )
  }
  valueOf(): never {
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
export const PlainTime: PlainTimeConstructor = createProxy(PlainTimeValue, {
  construct(target, args, newTarget) {
    if (import.meta.formatjsTemporalNativeData === true) {
      const values = names.map((_, index) =>
        argumentAt(args, index) === undefined
          ? 0
          : integer(argumentAt(args, index))
      )
      const value = nativeTemporal()!.regulatePlainTimeResult(values, false)
      const prototype = newTarget.prototype
      const result = createObject(
        object(prototype) ? prototype : target.prototype
      )
      setNativeTimeSlot(result, value)
      return result
    }
    const values = names.map((_, index) =>
      argumentAt(args, index) === undefined
        ? 0
        : integer(argumentAt(args, index))
    )
    const value = regulate(values, false)
    const prototype = newTarget.prototype
    const result = createObject(
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
defineGetters(PlainTimeValue.prototype, names, (receiver, _name, index) =>
  import.meta.formatjsTemporalNativeData === true
    ? nativeTime(receiver as object).fields[index]
    : fields(read(receiver))[index]
)
