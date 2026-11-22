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
  constructorPrototype,
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
import {toPlainTimeNanoseconds} from '#packages/temporal/plain-time.js'
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
  allocateDate,
  getDateTimeSlot,
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
// Temporal comparison §3.3.7 step 2.
// Check the PlainDate receiver before calendar projection.
function read(item: unknown): DateSlot {
  const slot = getDateSlot(item as object)
  if (!slot) throw new TypeErrorConstructor('Invalid PlainDate receiver')
  return slot
}
// Temporal comparison §3.5.3 steps 1–5. Allocate with the local prototype.
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
  return allocateDate(
    PlainDateValue.prototype,
    typeof value === 'number' ? {epochDay, calendar} : value
  ) as PlainDateObject
}
// Temporal comparison §3.5.4 steps 3, 4, 7, 9, 10.
// Delegate date parsing and build the prepared date record.
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
// Temporal comparison §3.5.15 steps 2, 3, 4, 6, 7, 8.
// Route the signed date-duration addition.
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
// Temporal comparison §3.5.14 steps 1, 2, 3, 4, 9.
// Temporal comparison §§3.3.25 step 3, 3.3.26 step 3: shared difference dispatch.
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
    largestText = largestRaw === undefined ? 'auto' : ToString(largestRaw),
    largestOption = largestText === 'auto' ? undefined : unitOption(largestText)
  const increment = roundingIncrement(resolved.roundingIncrement),
    mode = roundingMode(resolved.roundingMode, 'trunc')
  const smallest = unitOption(resolved.smallestUnit) ?? 'day'
  const names = ['year', 'month', 'week', 'day'],
    smallIndex = arrayIndexOf(names, smallest)
  if (smallIndex < 0) throw new RangeErrorConstructor('Invalid date units')
  const largest =
    largestText === 'auto' ? names[mathMin(3, smallIndex)] : largestOption!
  if (
    !arrayIncludes(names, largest) ||
    arrayIndexOf(names, largest) > smallIndex
  )
    throw new RangeErrorConstructor('Invalid date units')
  // Temporal comparison §3.5.14 step 6, arguments only: preserve calendar,
  // ordered ISO days and largest unit. Midnight anchors need no day borrow.
  // CalendarDateUntil's result and later rounding remain separate contracts.
  // https://tc39.es/proposal-temporal/#sec-temporal-differencetemporalplaindate
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
  // Temporal comparison §3.5.14 step 8.e passes midnight anchors and
  // the prepared rounding settings to the shared plain-date engine.
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

// Temporal comparison §3.5.11 steps 1, 2, 3, 4, 5.
// Format the private ISO date with its calendar annotation.
function format(slot: DateSlot, calendarName: unknown = undefined): string {
  const show = calendarNameOption(calendarName),
    native = nativeTemporal()
  if (import.meta.formatjsTemporalNativeData === true || native)
    return native!.formatPlainDate(slot, show)
  return formatISODate(slot.epochDay) + calendarAnnotation(slot.calendar, show)
}
class PlainDateValue {
  toPlainYearMonth(): PlainYearMonthObject {
    // Temporal comparison §3.3.19 steps 1–7.
    // https://tc39.es/proposal-temporal/#sec-temporal.plaindate.prototype.toplainyearmonth
    // Temporal comparison §3.3.19 step5: private fields have no inherited era state.
    const slot = read(this)
    return createPlainYearMonth(
      yearMonthFields(
        slot.calendar,
        {__proto__: null, ...dateFields(slot)},
        'constrain'
      )
    )
  }
  toPlainMonthDay(): PlainMonthDayObject {
    // Temporal comparison §3.3.20 steps 1–7.
    // https://tc39.es/proposal-temporal/#sec-temporal.plaindate.prototype.toplainmonthday
    // Temporal comparison §3.3.20 step5: prepare private calendar fields.
    const slot = read(this)
    return createPlainMonthDay(
      monthDayFields(
        slot.calendar,
        {__proto__: null, ...dateFields(slot)},
        'constrain'
      )
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
    // Temporal comparison §3.2.2 step 1.
    // https://tc39.es/proposal-temporal/#sec-temporal.plaindate.from
    const slot = toPlainDateSlot(item, options)
    return createPlainDate(slot, slot.calendar)
  }
  static compare(one: unknown, two: unknown): -1 | 0 | 1 {
    // Temporal comparison §3.2.3 steps 1–3.
    // https://tc39.es/proposal-temporal/#sec-temporal.plaindate.compare
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
    // Temporal comparison §3.3.23 steps 1–11.
    // https://tc39.es/proposal-temporal/#sec-temporal.plaindate.prototype.with
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
    // Temporal comparison §3.3.24 steps 1–4.
    // https://tc39.es/proposal-temporal/#sec-temporal.plaindate.prototype.withcalendar
    const slot = read(this)
    if (calendar === undefined)
      throw new TypeErrorConstructor('Calendar required')
    return createPlainDate(slot.epochDay, calendarId(calendar))
  }
  add(duration: unknown, options: unknown = undefined): PlainDateObject {
    // Temporal comparison §3.3.21 steps 1–3.
    // https://tc39.es/proposal-temporal/#sec-temporal.plaindate.prototype.add
    return add(read(this), duration, options, 1)
  }
  subtract(duration: unknown, options: unknown = undefined): PlainDateObject {
    // Temporal comparison §3.3.22 steps 1–3.
    // https://tc39.es/proposal-temporal/#sec-temporal.plaindate.prototype.subtract
    return add(read(this), duration, options, -1)
  }
  until(other: unknown, options: unknown = undefined): DurationObject {
    // Temporal comparison §3.3.25 steps 1–3.
    // Step 3 forwards the receiver, other and options with since=false.
    // https://tc39.es/proposal-temporal/#sec-temporal.plaindate.prototype.until
    return difference(read(this), other, options, false)
  }
  since(other: unknown, options: unknown = undefined): DurationObject {
    // Temporal comparison §3.3.26 steps 1–3.
    // Step 3 keeps operand order and forwards options with since=true.
    // https://tc39.es/proposal-temporal/#sec-temporal.plaindate.prototype.since
    return difference(read(this), other, options, true)
  }
  equals(other: unknown): boolean {
    // Temporal comparison §3.3.27 steps 1–5.
    // https://tc39.es/proposal-temporal/#sec-temporal.plaindate.prototype.equals
    const a = read(this),
      b = toPlainDateSlot(other)
    return a.epochDay === b.epochDay && a.calendar === b.calendar
  }
  toZonedDateTime(item: unknown): ZonedDateTimeObject {
    // Temporal comparison §3.3.29 steps 1–7.
    // https://tc39.es/proposal-temporal/#sec-temporal.plaindate.prototype.tozoneddatetime
    const slot = read(this)
    let zone: unknown = item,
      time: unknown
    if (object(item)) {
      const raw = item.timeZone
      zone = timeZoneIdentifier(raw === undefined ? item : raw)
      // Temporal comparison §3.3.29 step3.b.ii skips this Get for direct zones.
      if (raw !== undefined) time = item.plainTime
    } else zone = timeZoneIdentifier(item)
    // Temporal comparison §3.3.29 step6.a: intrinsic time conversion.
    const clock = time === undefined ? 0n : toPlainTimeNanoseconds(time)
    return zonedFromLocal(
      bigIntFrom(slot.epochDay) * nsPerDay + clock,
      zone,
      slot.calendar,
      undefined,
      time === undefined
    )
  }
  toPlainDateTime(time: unknown = undefined): PlainDateTimeObject {
    // Temporal comparison §3.3.28 steps 1–5.
    // https://tc39.es/proposal-temporal/#sec-temporal.plaindate.prototype.toplaindatetime
    // Temporal comparison §3.3.28 step3 uses private ToTemporalTime conversion.
    const slot = read(this)
    // ECMA-262 preview §22.3.15.14 steps 1–3: default to a zero clock or convert the input.
    // https://tc39.es/ecma262/pr/3966/#sec-totimerecordormidnight
    // §22.3.15.7 step 1: zero nanoseconds encode midnight.
    // https://tc39.es/ecma262/pr/3966/#sec-midnighttimerecord
    const clock = time === undefined ? 0n : toPlainTimeNanoseconds(time)
    return createPlainDateTime(
      bigIntFrom(slot.epochDay) * nsPerDay + clock,
      slot.calendar
    )
  }
  toString(options: unknown = undefined): string {
    // Temporal comparison §3.3.30 steps 1–5.
    // https://tc39.es/proposal-temporal/#sec-temporal.plaindate.prototype.tostring
    const slot = read(this)
    return format(slot, optionsObject(options).calendarName)
  }
  toLocaleString(
    locales: unknown = undefined,
    options: unknown = undefined
  ): string {
    // Temporal comparison §3.3.31 steps 1–3.
    // https://tc39.es/proposal-temporal/#sec-temporal.plaindate.prototype.tolocalestring
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
      localeStringIntrinsic,
      this
    )
  }
  toJSON(): string {
    // Temporal comparison §3.3.32 steps 1–3.
    // https://tc39.es/proposal-temporal/#sec-temporal.plaindate.prototype.tojson
    return format(read(this))
  }
  valueOf(): never {
    // Temporal comparison §3.3.33 step 1.
    // https://tc39.es/proposal-temporal/#sec-temporal.plaindate.prototype.valueof
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
// Temporal comparison §3.2.1.
// https://tc39.es/proposal-temporal/#sec-temporal.plaindate.prototype
export const PlainDate: PlainDateConstructor = createProxy(PlainDateValue, {
  construct(target, args, newTarget) {
    // Temporal comparison §3.1.1 steps 1–10.
    // https://tc39.es/proposal-temporal/#sec-temporal.plaindate
    const year = integer(argumentAt(args, 0)),
      month = integer(argumentAt(args, 1)),
      day = integer(argumentAt(args, 2)),
      calendar = constructorCalendar(argumentAt(args, 3))
    const epochDay = isoDay(year, month, day)
    const prototype = constructorPrototype(newTarget, target)
    return allocateDate(prototype, {epochDay, calendar})
  },
}) as unknown as PlainDateConstructor
Object.defineProperties(PlainDateValue.prototype, {
  // Temporal comparison §3.3.1.
  // https://tc39.es/proposal-temporal/#sec-temporal.plaindate.prototype.constructor
  constructor: {value: PlainDate, writable: true, configurable: true},
  // Temporal comparison §3.3.2.
  // https://tc39.es/proposal-temporal/#sec-temporal.plaindate.prototype-%symbol.tostringtag%
  [Symbol.toStringTag]: {value: 'Temporal.PlainDate', configurable: true},
})
// Temporal comparison §3.3.3 steps 1–3.
// https://tc39.es/proposal-temporal/#sec-get-temporal.plaindate.prototype.calendarid
// Temporal comparison §3.3.4 steps 1–3.
// https://tc39.es/proposal-temporal/#sec-get-temporal.plaindate.prototype.era
// Temporal comparison §3.3.5 steps 1–5.
// https://tc39.es/proposal-temporal/#sec-get-temporal.plaindate.prototype.erayear
// Temporal comparison §3.3.6 steps 1–3.
// https://tc39.es/proposal-temporal/#sec-get-temporal.plaindate.prototype.year
// Temporal comparison §3.3.7 steps 1–3.
// https://tc39.es/proposal-temporal/#sec-get-temporal.plaindate.prototype.month
// Temporal comparison §3.3.8 steps 1–3.
// https://tc39.es/proposal-temporal/#sec-get-temporal.plaindate.prototype.monthcode
// Temporal comparison §3.3.9 steps 1–3.
// https://tc39.es/proposal-temporal/#sec-get-temporal.plaindate.prototype.day
// Temporal comparison §3.3.10 steps 1–3.
// https://tc39.es/proposal-temporal/#sec-get-temporal.plaindate.prototype.dayofweek
// Temporal comparison §3.3.11 steps 1–3.
// https://tc39.es/proposal-temporal/#sec-get-temporal.plaindate.prototype.dayofyear
// Temporal comparison §3.3.12 steps 1–5.
// https://tc39.es/proposal-temporal/#sec-get-temporal.plaindate.prototype.weekofyear
// Temporal comparison §3.3.13 steps 1–5.
// https://tc39.es/proposal-temporal/#sec-get-temporal.plaindate.prototype.yearofweek
// Temporal comparison §3.3.14 steps 1–3.
// https://tc39.es/proposal-temporal/#sec-get-temporal.plaindate.prototype.daysinweek
// Temporal comparison §3.3.15 steps 1–3.
// https://tc39.es/proposal-temporal/#sec-get-temporal.plaindate.prototype.daysinmonth
// Temporal comparison §3.3.16 steps 1–3.
// https://tc39.es/proposal-temporal/#sec-get-temporal.plaindate.prototype.daysinyear
// Temporal comparison §3.3.17 steps 1–3.
// https://tc39.es/proposal-temporal/#sec-get-temporal.plaindate.prototype.monthsinyear
// Temporal comparison §3.3.18 steps 1–3.
// https://tc39.es/proposal-temporal/#sec-get-temporal.plaindate.prototype.inleapyear
defineGetters(PlainDateValue.prototype, datePropertyNames, (receiver, name) =>
  dateProperty(read(receiver), name)
)
