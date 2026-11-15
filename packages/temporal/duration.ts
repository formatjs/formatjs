import {
  durationFieldNames,
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
} from '#packages/temporal/rounding.js'

export interface DurationObject extends Readonly<DurationFields> {
  readonly sign: number
  readonly blank: boolean
  with(fields: unknown): DurationObject
  negated(): DurationObject
  abs(): DurationObject
  add(other: unknown): DurationObject
  subtract(other: unknown): DurationObject
  total(options: unknown): number
  toString(options?: unknown): string
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
  return validateDuration({...zeroDuration(), ...partialDuration(value)})
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
  const two = toDurationFields(other)
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
function formatDuration(
  fields: DurationFields,
  digits: number | 'auto' = 'auto'
): string {
  const sign = durationSign(fields)
  const absolute = Object.fromEntries(
    durationFieldNames.map(key => [key, Math.abs(fields[key])])
  ) as DurationFields
  let result = sign < 0 ? '-P' : 'P'
  for (const [key, designator] of [
    ['years', 'Y'],
    ['months', 'M'],
    ['weeks', 'W'],
    ['days', 'D'],
  ] as const)
    if (absolute[key]) result += absolute[key] + designator
  let time = ''
  if (absolute.hours) time += absolute.hours + 'H'
  if (absolute.minutes) time += absolute.minutes + 'M'
  const secondNs =
    BigInt(absolute.seconds) * 1_000_000_000n +
    BigInt(absolute.milliseconds) * 1_000_000n +
    BigInt(absolute.microseconds) * 1000n +
    BigInt(absolute.nanoseconds)
  const fraction = String(secondNs % 1_000_000_000n).padStart(9, '0')
  const decimals =
    digits === 'auto' ? fraction.replace(/0+$/, '') : fraction.slice(0, digits)
  if (
    secondNs !== 0n ||
    digits !== 'auto' ||
    ((result === 'P' || result === '-P') && time === '')
  )
    time +=
      String(secondNs / 1_000_000_000n) + (decimals ? '.' + decimals : '') + 'S'
  return result + (time ? 'T' + time : '')
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
    const left = toDurationFields(one),
      right = toDurationFields(two)
    const resolved = optionsObject(options)
    if (resolved.relativeTo !== undefined)
      throw new RangeError('Relative calendar operations are not implemented')
    if (durationFieldNames.every(field => left[field] === right[field]))
      return 0
    if (
      left.years ||
      left.months ||
      left.weeks ||
      right.years ||
      right.months ||
      right.weeks
    )
      throw new RangeError('Calendar comparison requires relativeTo')
    const a = durationNanoseconds(left),
      b = durationNanoseconds(right)
    return a < b ? -1 : a > b ? 1 : 0
  }
  static from(value: unknown): DurationObject {
    return createDuration(toDurationFields(value))
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
    return createDuration(
      Object.fromEntries(
        durationFieldNames.map(key => [key, -read(this)[key] || 0])
      ) as DurationFields
    )
  }
  abs(): DurationObject {
    return createDuration(
      Object.fromEntries(
        durationFieldNames.map(key => [key, Math.abs(read(this)[key])])
      ) as DurationFields
    )
  }
  add(other: unknown): DurationObject {
    return addDurations(read(this), other, 1)
  }
  subtract(other: unknown): DurationObject {
    return addDurations(read(this), other, -1)
  }
  total(options: unknown): number {
    const fields = read(this)
    if (options === undefined) throw new TypeError('totalOf is required')
    const resolved =
      typeof options === 'string'
        ? Object.assign(Object.create(null), {unit: options})
        : optionsObject(options)
    const relativeTo = resolved.relativeTo
    const unit = unitOption(resolved.unit)
    if (relativeTo !== undefined)
      throw new RangeError('Relative calendar operations are not implemented')
    if (unit === undefined) throw new RangeError('unit is required')
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
for (const field of durationFieldNames) {
  const accessor = {
    get [field](): number {
      return read(this)[field]
    },
  }
  Object.defineProperty(DurationValue.prototype, field, {
    get: Object.getOwnPropertyDescriptor(accessor, field)!.get,
    configurable: true,
  })
}
Object.defineProperties(DurationValue.prototype, {
  constructor: {value: Duration, writable: true, configurable: true},
  [Symbol.toStringTag]: {value: 'Temporal.Duration', configurable: true},
})
