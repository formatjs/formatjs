import {
  RangeErrorConstructor,
  TypeErrorConstructor,
  arrayIncludes,
  arrayIndexOf,
  bigIntFrom,
  mathMin,
  numberFrom,
  numberIsInteger,
} from '#packages/ecma262-abstract/intrinsics.js'
import {
  argumentAt,
  createObject,
  createProxy,
} from '#packages/temporal/intrinsics.js'
import {defineGetters} from '#packages/temporal/accessors.js'
import {nativeTemporal} from '#packages/temporal/native.js'
import {localeDateTime} from '#packages/temporal/locale.js'
import {
  zonedFromLocal,
  type ZonedDateTimeObject,
} from '#packages/temporal/zoned-date-time.js'
import {timeZoneIdentifier} from '#packages/temporal/zones.js'
import {
  createPlainDateTime,
  type PlainDateTimeObject,
} from '#packages/temporal/plain-date-time.js'
import {PlainTime} from '#packages/temporal/plain-time.js'
import {
  createPlainYearMonth,
  type PlainYearMonthObject,
} from '#packages/temporal/plain-year-month.js'
import {
  createPlainMonthDay,
  type PlainMonthDayObject,
} from '#packages/temporal/plain-month-day.js'
import {
  yearMonthFields,
  monthDayFields,
} from '#packages/temporal/short-date-core.js'
import {
  getDateSlot,
  getZonedDateTimeSlot,
  setDateSlot,
  getDateTimeSlot,
  getTimeSlot,
  type DateSlot,
} from '#packages/temporal/plain-slots.js'
import {
  dateFields,
  dateFieldsView,
  dateProperty,
  datePropertyNames,
  calendarId,
  calendarFromObject,
  constructorCalendar,
  prepareDateTimeString,
  calendarAnnotation,
  calendarNameOption,
  formatISODate,
  readDateFields,
  mergeDateFields,
  isoDay,
  epochDayOf,
  dayFromFields,
  partialObject,
  object,
  integer,
  overflowOption,
  addDate,
  nsPerDay,
  roundedDateTimeDifference,
} from '#packages/temporal/date-core.js'
import {
  toDurationFields,
  toNativeDurationFields,
  createDuration,
  createNativeDuration,
  type DurationObject,
} from '#packages/temporal/duration.js'
import {
  durationFieldNames,
  durationNanoseconds,
} from '#packages/temporal/duration-core.js'
import {ToString} from '#packages/ecma262-abstract/ToString.js'
import {
  optionsObject,
  unitOption,
  roundingIncrement,
  roundingMode,
} from '#packages/temporal/rounding.js'

export interface DateProperties {
  readonly calendarId: string
  readonly era: string | undefined
  readonly eraYear: number | undefined
  readonly year: number
  readonly month: number
  readonly monthCode: string
  readonly day: number
  readonly dayOfWeek: number
  readonly dayOfYear: number
  readonly weekOfYear: number | undefined
  readonly yearOfWeek: number | undefined
  readonly daysInWeek: number
  readonly daysInMonth: number
  readonly daysInYear: number
  readonly monthsInYear: number
  readonly inLeapYear: boolean
}
export interface PlainDateObject extends DateProperties {
  readonly [Symbol.toStringTag]: 'Temporal.PlainDate'
  toPlainYearMonth(): PlainYearMonthObject
  toPlainMonthDay(): PlainMonthDayObject
  with(item: unknown, options?: unknown): PlainDateObject
  withCalendar(calendar: unknown): PlainDateObject
  add(duration: unknown, options?: unknown): PlainDateObject
  subtract(duration: unknown, options?: unknown): PlainDateObject
  until(other: unknown, options?: unknown): DurationObject
  since(other: unknown, options?: unknown): DurationObject
  equals(other: unknown): boolean
  toZonedDateTime(item: unknown): ZonedDateTimeObject
  toPlainDateTime(time?: unknown): PlainDateTimeObject
  toString(options?: unknown): string
  toLocaleString(locales?: unknown, options?: unknown): string
  toJSON(): string
  valueOf(): never
}
export interface PlainDateConstructor {
  new (
    year: unknown,
    month: unknown,
    day: unknown,
    calendar?: unknown
  ): PlainDateObject
  readonly prototype: PlainDateObject
  from(item: unknown, options?: unknown): PlainDateObject
  compare(one: unknown, two: unknown): -1 | 0 | 1
}
function read(item: unknown): DateSlot {
  const slot = getDateSlot(item as object)
  if (!slot) throw new TypeErrorConstructor('Invalid PlainDate receiver')
  return slot
}
export function createPlainDate(
  value: number | DateSlot,
  calendar: string
): PlainDateObject {
  const epochDay = typeof value === 'number' ? value : value.epochDay
  if (
    !numberIsInteger(epochDay) ||
    epochDay < -100000001 ||
    epochDay > 100000000
  )
    throw new RangeErrorConstructor('Date out of range')
  const result = createObject(PlainDateValue.prototype) as PlainDateObject
  setDateSlot(result, typeof value === 'number' ? {epochDay, calendar} : value)
  return result
}
export function toPlainDateSlot(item: unknown, options?: unknown): DateSlot {
  const date = getDateSlot(item as object),
    datetime =
      getDateTimeSlot(item as object) ?? getZonedDateTimeSlot(item as object)
  if (date || datetime) {
    overflowOption(options)
    return (
      date ?? {
        epochDay: epochDayOf(datetime!.epochNanoseconds),
        calendar: datetime!.calendar,
      }
    )
  }
  if (object(item)) {
    const calendar = calendarFromObject(item)
    const fields = readDateFields(item, false, false, 'date', calendar)
    if (
      import.meta.formatjsTemporalNativeData === true &&
      calendar === 'iso8601'
    )
      return nativeTemporal()!.createISODate(fields, overflowOption(options))
    return {
      epochDay: dayFromFields(calendar, fields, overflowOption(options)),
      calendar,
    }
  }
  if (typeof item !== 'string')
    throw new TypeErrorConstructor('Expected date string or object')
  const native = nativeTemporal()
  if (import.meta.formatjsTemporalNativeData === true || native) {
    if (options !== undefined) prepareDateTimeString(item, options)
    const result = native!.parsePlainDate(item)
    constructorCalendar(result.calendar)
    return result
  }
  const fields = prepareDateTimeString(item, options)
  return {
    epochDay: isoDay(fields.year, fields.month, fields.day),
    calendar: fields.calendar,
  }
}
function add(
  value: DateSlot,
  duration: unknown,
  options: unknown,
  sign: number
): PlainDateObject {
  const fields =
    import.meta.formatjsTemporalNativeData === true
      ? toNativeDurationFields(duration)
      : toDurationFields(duration)
  const native = nativeTemporal()
  if (import.meta.formatjsTemporalNativeData === true || native)
    return createPlainDate(
      native!.addPlainDate(
        value.epochDay,
        value.calendar,
        fields,
        sign < 0,
        overflowOption(options)
      ),
      value.calendar
    )
  for (let index = 0; index < durationFieldNames.length; index++)
    fields[durationFieldNames[index]] *= sign
  const time = durationNanoseconds(fields, false)
  fields.days += numberFrom(time / nsPerDay)
  return createPlainDate(
    addDate(value, fields, overflowOption(options)),
    value.calendar
  )
}
function difference(
  slot: DateSlot,
  other: unknown,
  options: unknown,
  since: boolean
): DurationObject {
  const end = toPlainDateSlot(other)
  if (slot.calendar !== end.calendar)
    throw new RangeErrorConstructor('Calendars differ')
  const resolved = optionsObject(options)
  const largestRaw = resolved.largestUnit,
    largestText = largestRaw === undefined ? 'auto' : ToString(largestRaw)
  const increment = roundingIncrement(resolved.roundingIncrement),
    mode = roundingMode(resolved.roundingMode, 'trunc')
  const smallest = unitOption(resolved.smallestUnit) ?? 'day'
  const names = ['year', 'month', 'week', 'day'],
    smallIndex = arrayIndexOf(names, smallest)
  const largest =
    largestText === 'auto'
      ? names[mathMin(3, smallIndex)]
      : unitOption(largestText)!
  if (
    smallIndex < 0 ||
    !arrayIncludes(names, largest) ||
    arrayIndexOf(names, largest) > smallIndex
  )
    throw new RangeErrorConstructor('Invalid date units')
  const native = nativeTemporal()
  if (import.meta.formatjsTemporalNativeData === true || native)
    return (
      import.meta.formatjsTemporalNativeData === true
        ? createNativeDuration
        : createDuration
    )(
      native!.differencePlainDate(
        slot.epochDay,
        end.epochDay,
        slot.calendar,
        largest,
        smallest,
        increment,
        mode,
        since
      )
    )
  return createDuration(
    roundedDateTimeDifference(
      bigIntFrom(slot.epochDay) * nsPerDay,
      bigIntFrom(end.epochDay) * nsPerDay,
      slot.calendar,
      largest,
      smallest,
      increment,
      mode,
      since
    )
  )
}

function format(slot: DateSlot, calendarName: unknown = undefined): string {
  const show = calendarNameOption(calendarName),
    native = nativeTemporal()
  if (import.meta.formatjsTemporalNativeData === true || native)
    return native!.formatPlainDate(slot, show)
  return formatISODate(slot.epochDay) + calendarAnnotation(slot.calendar, show)
}
class PlainDateValue {
  toPlainYearMonth(): PlainYearMonthObject {
    const slot = read(this)
    return createPlainYearMonth(
      yearMonthFields(slot.calendar, {...dateFields(slot)}, 'constrain')
    )
  }
  toPlainMonthDay(): PlainMonthDayObject {
    const slot = read(this)
    return createPlainMonthDay(
      monthDayFields(slot.calendar, {...dateFields(slot)}, 'constrain')
    )
  }
  constructor(
    _year: unknown,
    _month: unknown,
    _day: unknown,
    _calendar: unknown = undefined
  ) {
    throw new TypeErrorConstructor('Use exported PlainDate constructor')
  }
  static from(item: unknown, options: unknown = undefined): PlainDateObject {
    const slot = toPlainDateSlot(item, options)
    return createPlainDate(slot, slot.calendar)
  }
  static compare(one: unknown, two: unknown): -1 | 0 | 1 {
    const a = toPlainDateSlot(one).epochDay,
      b = toPlainDateSlot(two).epochDay
    // https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindate.html#L909-L915
    // L909: a greater year has a greater epoch day, regardless of month/day.
    // L910: a lesser year has a lesser epoch day, regardless of month/day.
    // L911: within one year, a greater month has a greater epoch day.
    // L912: within one year, a lesser month has a lesser epoch day.
    // L913: within one month, a greater day has a greater epoch day.
    // L914: within one month, a lesser day has a lesser epoch day.
    // L915: equal epoch days identify the same ISO date.
    // https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindate.html#L76
    // L76: compare the private ISO dates and return a Number sign, ignoring calendars.
    return a < b ? -1 : a > b ? 1 : 0
  }
  with(item: unknown, options: unknown = undefined): PlainDateObject {
    const slot = read(this),
      partial = readDateFields(
        partialObject(item),
        false,
        true,
        'date',
        slot.calendar
      )
    const native = nativeTemporal()
    if (import.meta.formatjsTemporalNativeData === true || native) {
      dateFields(slot)
      return createPlainDate(
        native!.withDate(slot, partial, overflowOption(options)),
        slot.calendar
      )
    }
    const fields = mergeDateFields(slot.calendar, dateFieldsView(slot), partial)
    return createPlainDate(
      dayFromFields(slot.calendar, fields, overflowOption(options)),
      slot.calendar
    )
  }
  withCalendar(calendar: unknown): PlainDateObject {
    const slot = read(this)
    if (calendar === undefined)
      throw new TypeErrorConstructor('Calendar required')
    return createPlainDate(slot.epochDay, calendarId(calendar))
  }
  add(duration: unknown, options: unknown = undefined): PlainDateObject {
    return add(read(this), duration, options, 1)
  }
  subtract(duration: unknown, options: unknown = undefined): PlainDateObject {
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
      b = toPlainDateSlot(other)
    return a.epochDay === b.epochDay && a.calendar === b.calendar
  }
  toZonedDateTime(item: unknown): ZonedDateTimeObject {
    const slot = read(this)
    let zone: unknown = item,
      time: unknown
    if (object(item)) {
      const raw = item.timeZone
      zone = timeZoneIdentifier(raw === undefined ? item : raw)
      time = item.plainTime
    } else zone = timeZoneIdentifier(item)
    const clock = time === undefined ? 0n : getTimeSlot(PlainTime.from(time))!
    return zonedFromLocal(
      bigIntFrom(slot.epochDay) * nsPerDay + clock,
      zone,
      slot.calendar,
      undefined,
      time === undefined
    )
  }
  toPlainDateTime(time: unknown = undefined): PlainDateTimeObject {
    const slot = read(this)
    const clock = time === undefined ? 0n : getTimeSlot(PlainTime.from(time))!
    return createPlainDateTime(
      bigIntFrom(slot.epochDay) * nsPerDay + clock,
      slot.calendar
    )
  }
  toString(options: unknown = undefined): string {
    const slot = read(this)
    return format(slot, optionsObject(options).calendarName)
  }
  toLocaleString(
    locales: unknown = undefined,
    options: unknown = undefined
  ): string {
    const slot = read(this)
    return localeDateTime(
      {
        kind: 'PlainDate',
        epochNanoseconds:
          bigIntFrom(slot.epochDay) * 86_400_000_000_000n + 43_200_000_000_000n,
        calendar: slot.calendar,
      },
      locales,
      options,
      () => localeStringIntrinsic.call(this)
    )
  }
  toJSON(): string {
    return format(read(this))
  }
  valueOf(): never {
    throw new TypeErrorConstructor(
      'Cannot convert Temporal.PlainDate to primitive'
    )
  }
}
const localeStringIntrinsic = PlainDateValue.prototype.toString

Object.defineProperty(PlainDateValue, 'name', {
  value: 'PlainDate',
  configurable: true,
})
export const PlainDate: PlainDateConstructor = createProxy(PlainDateValue, {
  construct(target, args, newTarget) {
    const year = integer(argumentAt(args, 0)),
      month = integer(argumentAt(args, 1)),
      day = integer(argumentAt(args, 2)),
      calendar = constructorCalendar(argumentAt(args, 3))
    const epochDay = isoDay(year, month, day)
    const prototype = newTarget.prototype
    const result = createObject(
      object(prototype) ? prototype : target.prototype
    )
    setDateSlot(result, {epochDay, calendar})
    return result
  },
}) as unknown as PlainDateConstructor
Object.defineProperties(PlainDateValue.prototype, {
  constructor: {value: PlainDate, writable: true, configurable: true},
  [Symbol.toStringTag]: {value: 'Temporal.PlainDate', configurable: true},
})
defineGetters(PlainDateValue.prototype, datePropertyNames, (receiver, name) =>
  dateProperty(read(receiver), name)
)
