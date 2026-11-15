import {ToString} from '#packages/ecma262-abstract/ToString.js'
import {
  createPlainDate,
  type PlainDateObject,
  type DateProperties,
} from '#packages/temporal/plain-date.js'
import {
  PlainTime,
  createPlainTime,
  roundTime,
  type PlainTimeObject,
} from '#packages/temporal/plain-time.js'
import {
  getDateSlot,
  getDateTimeSlot,
  setDateTimeSlot,
  getTimeSlot,
  type DateTimeSlot,
} from '#packages/temporal/plain-slots.js'
import {parsePlainDateTimeString} from '#packages/temporal/instant-string.js'
import {
  epochNanosecondsToISO,
  isoToEpochNanoseconds,
} from '#packages/temporal/kernel.js'
import {formatInstant} from '#packages/temporal/instant-format.js'
import {
  calendarId,
  constructorCalendar,
  calendarAnnotation,
  object,
  integer,
  overflowOption,
  readDateFields,
  dayFromFields,
  dateFields,
  dateProperty,
  datePropertyNames,
  clockNames,
  clockBounds,
  clockFactors,
  clockNanoseconds,
  nsPerDay,
  epochDayOf,
  timeOf,
  checkDateTime,
  partialObject,
  addDate,
  roundedDateTimeDifference,
} from '#packages/temporal/date-core.js'
import {
  createDuration,
  toDurationFields,
  type DurationObject,
} from '#packages/temporal/duration.js'
import {durationNanoseconds} from '#packages/temporal/duration-core.js'
import {
  optionsObject,
  fractionalSecondDigits,
  roundingIncrement,
  roundingMode,
  unitOption,
  timeUnit,
  roundInstant,
  type Precision,
} from '#packages/temporal/rounding.js'

export interface PlainDateTimeObject extends DateProperties {
  readonly hour: number
  readonly minute: number
  readonly second: number
  readonly millisecond: number
  readonly microsecond: number
  readonly nanosecond: number
  with(item: unknown, options?: unknown): PlainDateTimeObject
  withCalendar(calendar: unknown): PlainDateTimeObject
  withPlainTime(time?: unknown): PlainDateTimeObject
  add(duration: unknown, options?: unknown): PlainDateTimeObject
  subtract(duration: unknown, options?: unknown): PlainDateTimeObject
  until(other: unknown, options?: unknown): DurationObject
  since(other: unknown, options?: unknown): DurationObject
  round(roundTo: unknown): PlainDateTimeObject
  equals(other: unknown): boolean
  toPlainDate(): PlainDateObject
  toPlainTime(): PlainTimeObject
  toString(options?: unknown): string
  toJSON(): string
  valueOf(): never
}
export interface PlainDateTimeConstructor {
  new (
    year: unknown,
    month: unknown,
    day: unknown,
    hour?: unknown,
    minute?: unknown,
    second?: unknown,
    millisecond?: unknown,
    microsecond?: unknown,
    nanosecond?: unknown,
    calendar?: unknown
  ): PlainDateTimeObject
  readonly prototype: PlainDateTimeObject
  from(item: unknown, options?: unknown): PlainDateTimeObject
  compare(one: unknown, two: unknown): -1 | 0 | 1
}
function read(item: unknown): DateTimeSlot {
  const slot = getDateTimeSlot(item as object)
  if (!slot) throw new TypeError('Invalid PlainDateTime receiver')
  return slot
}
export function createPlainDateTime(
  value: bigint,
  calendar: string
): PlainDateTimeObject {
  checkDateTime(value)
  const result = Object.create(
    PlainDateTimeValue.prototype
  ) as PlainDateTimeObject
  setDateTimeSlot(result, {epochNanoseconds: value, calendar})
  return result
}
function dateSlot(slot: DateTimeSlot): {epochDay: number; calendar: string} {
  return {epochDay: epochDayOf(slot.epochNanoseconds), calendar: slot.calendar}
}
export function toPlainDateTimeSlot(
  item: unknown,
  options?: unknown
): DateTimeSlot {
  const existing = getDateTimeSlot(item as object),
    date = getDateSlot(item as object)
  if (existing || date) {
    overflowOption(options)
    return (
      existing ?? {
        epochNanoseconds: checkDateTime(BigInt(date!.epochDay) * nsPerDay),
        calendar: date!.calendar,
      }
    )
  }
  if (object(item)) {
    const calendar = calendarId(item.calendar)
    const fields = readDateFields(item, true),
      overflow = overflowOption(options)
    const day = dayFromFields(calendar, fields, overflow),
      clock = clockNanoseconds(fields, overflow)
    return {
      epochNanoseconds: checkDateTime(BigInt(day) * nsPerDay + clock),
      calendar,
    }
  }
  if (typeof item !== 'string')
    throw new TypeError('Expected date/time string or object')
  const parsed = parsePlainDateTimeString(item),
    calendar = constructorCalendar(parsed.calendar)
  overflowOption(options)
  return {...parsed, calendar}
}
function add(
  slot: DateTimeSlot,
  duration: unknown,
  options: unknown,
  sign: number
): PlainDateTimeObject {
  const fields = toDurationFields(duration)
  for (const key of Object.keys(fields) as (keyof typeof fields)[])
    fields[key] *= sign
  const overflow = overflowOption(options)
  const time =
    timeOf(slot.epochNanoseconds) + durationNanoseconds(fields, false)
  const carry = epochDayOf(time)
  fields.days += carry
  const day = addDate(dateSlot(slot), fields, overflow)
  return createPlainDateTime(
    BigInt(day) * nsPerDay + timeOf(time),
    slot.calendar
  )
}
function difference(
  slot: DateTimeSlot,
  other: unknown,
  options: unknown,
  since: boolean
): DurationObject {
  const end = toPlainDateTimeSlot(other)
  if (slot.calendar !== end.calendar) throw new RangeError('Calendars differ')
  const resolved = optionsObject(options)
  const largestRaw = resolved.largestUnit,
    largestText = largestRaw === undefined ? 'auto' : ToString(largestRaw)
  const increment = roundingIncrement(resolved.roundingIncrement),
    mode = roundingMode(resolved.roundingMode, 'trunc')
  const smallest = unitOption(resolved.smallestUnit) ?? 'nanosecond'
  const names = ['year', 'month', 'week', 'day', ...clockNames]
  const smallIndex = names.indexOf(smallest)
  const largest =
    largestText === 'auto'
      ? names[Math.min(3, smallIndex)]
      : unitOption(largestText)!
  if (names.indexOf(largest) > smallIndex)
    throw new RangeError('Largest unit smaller than smallest unit')
  return createDuration(
    roundedDateTimeDifference(
      slot.epochNanoseconds,
      end.epochNanoseconds,
      slot.calendar,
      largest,
      smallest,
      increment,
      mode,
      since
    )
  )
}
function format(
  slot: DateTimeSlot,
  precision: Precision = 'auto',
  annotation: unknown = undefined,
  value = slot.epochNanoseconds
): string {
  return (
    formatInstant(value, precision).slice(0, -1) +
    calendarAnnotation(slot.calendar, annotation)
  )
}
class PlainDateTimeValue {
  constructor(
    _year: unknown,
    _month: unknown,
    _day: unknown,
    _hour: unknown = undefined,
    _minute?: unknown,
    _second?: unknown,
    _millisecond?: unknown,
    _microsecond?: unknown,
    _nanosecond?: unknown,
    _calendar?: unknown
  ) {
    throw new TypeError('Use exported PlainDateTime constructor')
  }
  static from(
    item: unknown,
    options: unknown = undefined
  ): PlainDateTimeObject {
    const slot = toPlainDateTimeSlot(item, options)
    return createPlainDateTime(slot.epochNanoseconds, slot.calendar)
  }
  static compare(one: unknown, two: unknown): -1 | 0 | 1 {
    const a = toPlainDateTimeSlot(one).epochNanoseconds,
      b = toPlainDateTimeSlot(two).epochNanoseconds
    return a < b ? -1 : a > b ? 1 : 0
  }
  with(item: unknown, options: unknown = undefined): PlainDateTimeObject {
    const slot = read(this),
      partial = readDateFields(partialObject(item), true, true)
    const current = {
      ...dateFields(dateSlot(slot)),
      ...epochNanosecondsToISO(slot.epochNanoseconds),
    }
    Object.assign(current, dateFields(dateSlot(slot)))
    const fields: Record<string, unknown> = {...current, ...partial}
    if (partial.month !== undefined && partial.monthCode === undefined)
      delete fields.monthCode
    if (partial.monthCode !== undefined && partial.month === undefined)
      delete fields.month
    const overflow = overflowOption(options)
    return createPlainDateTime(
      BigInt(dayFromFields(slot.calendar, fields, overflow)) * nsPerDay +
        clockNanoseconds(fields, overflow),
      slot.calendar
    )
  }
  withCalendar(calendar: unknown): PlainDateTimeObject {
    const slot = read(this)
    if (calendar === undefined) throw new TypeError('Calendar required')
    return createPlainDateTime(slot.epochNanoseconds, calendarId(calendar))
  }
  withPlainTime(time: unknown = undefined): PlainDateTimeObject {
    const slot = read(this)
    const clock = time === undefined ? 0n : getTimeSlot(PlainTime.from(time))!
    return createPlainDateTime(
      BigInt(epochDayOf(slot.epochNanoseconds)) * nsPerDay + clock,
      slot.calendar
    )
  }
  add(duration: unknown, options: unknown = undefined): PlainDateTimeObject {
    return add(read(this), duration, options, 1)
  }
  subtract(
    duration: unknown,
    options: unknown = undefined
  ): PlainDateTimeObject {
    return add(read(this), duration, options, -1)
  }
  until(other: unknown, options: unknown = undefined): DurationObject {
    return difference(read(this), other, options, false)
  }
  since(other: unknown, options: unknown = undefined): DurationObject {
    return difference(read(this), other, options, true)
  }
  equals(other: unknown): boolean {
    const a = read(this),
      b = toPlainDateTimeSlot(other)
    return (
      a.epochNanoseconds === b.epochNanoseconds && a.calendar === b.calendar
    )
  }
  toPlainDate(): PlainDateObject {
    const slot = read(this)
    return createPlainDate(epochDayOf(slot.epochNanoseconds), slot.calendar)
  }
  toPlainTime(): PlainTimeObject {
    return createPlainTime(timeOf(read(this).epochNanoseconds))
  }
  round(roundTo: unknown): PlainDateTimeObject {
    const slot = read(this)
    if (roundTo === undefined) throw new TypeError('roundTo required')
    const resolved: Record<string, unknown> =
      typeof roundTo === 'string'
        ? Object.assign(Object.create(null), {smallestUnit: roundTo})
        : optionsObject(roundTo)
    const increment = roundingIncrement(resolved.roundingIncrement),
      mode = roundingMode(resolved.roundingMode, 'halfExpand'),
      unit = unitOption(resolved.smallestUnit)
    const clock = timeOf(slot.epochNanoseconds)
    let rounded: bigint
    if (unit === 'day') {
      if (increment !== 1) throw new RangeError('Invalid day increment')
      rounded = roundInstant(clock, nsPerDay, mode)
    } else rounded = roundTime(clock, timeUnit(unit), increment, mode)
    return createPlainDateTime(
      BigInt(epochDayOf(slot.epochNanoseconds)) * nsPerDay + rounded,
      slot.calendar
    )
  }
  toString(options: unknown = undefined): string {
    const slot = read(this),
      resolved = optionsObject(options)
    const annotation = resolved.calendarName
    const suffix = calendarAnnotation(slot.calendar, annotation)
    const digits = fractionalSecondDigits(resolved.fractionalSecondDigits),
      mode = roundingMode(resolved.roundingMode, 'trunc'),
      raw = unitOption(resolved.smallestUnit)
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
    const quantum =
      precision === 'auto'
        ? 1n
        : precision === 'minute'
          ? 60_000_000_000n
          : 10n ** BigInt(9 - precision)
    const value =
      BigInt(epochDayOf(slot.epochNanoseconds)) * nsPerDay +
      roundInstant(timeOf(slot.epochNanoseconds), quantum, mode)
    return formatInstant(value, precision).slice(0, -1) + suffix
  }
  toJSON(): string {
    return format(read(this))
  }
  valueOf(): never {
    throw new TypeError('Cannot convert Temporal.PlainDateTime to primitive')
  }
}
Object.defineProperty(PlainDateTimeValue, 'name', {
  value: 'PlainDateTime',
  configurable: true,
})
export const PlainDateTime: PlainDateTimeConstructor = new Proxy(
  PlainDateTimeValue,
  {
    construct(target, args, newTarget) {
      const year = integer(args[0]),
        month = integer(args[1]),
        day = integer(args[2])
      const clock = Object.create(null) as Record<string, number>
      for (let index = 0; index < 6; index++)
        clock[clockNames[index]] =
          args[index + 3] === undefined ? 0 : integer(args[index + 3])
      const calendar = constructorCalendar(args[9])
      const value = isoToEpochNanoseconds({year, month, day, ...clock})
      const prototype = Reflect.get(newTarget, 'prototype')
      const result = Object.create(
        object(prototype) ? prototype : target.prototype
      )
      setDateTimeSlot(result, {epochNanoseconds: value, calendar})
      return result
    },
  }
) as unknown as PlainDateTimeConstructor
Object.defineProperties(PlainDateTimeValue.prototype, {
  constructor: {value: PlainDateTime, writable: true, configurable: true},
  [Symbol.toStringTag]: {value: 'Temporal.PlainDateTime', configurable: true},
})
for (const name of [...datePropertyNames, ...clockNames]) {
  const descriptor = Object.getOwnPropertyDescriptor(
    {
      get [name]() {
        const slot = read(this),
          index = (clockNames as readonly string[]).indexOf(name)
        return index < 0
          ? dateProperty(dateSlot(slot), name)
          : Number(
              (timeOf(slot.epochNanoseconds) / clockFactors[index]) %
                BigInt(clockBounds[index] + 1)
            )
      },
    },
    name
  )!
  Object.defineProperty(PlainDateTimeValue.prototype, name, {
    ...descriptor,
    enumerable: false,
  })
}
