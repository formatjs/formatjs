import {
  RangeErrorConstructor,
  TypeErrorConstructor,
  bigIntFrom,
} from '#packages/ecma262-abstract/intrinsics.js'
import {
  argumentAt,
  constructorPrototype,
  createObject,
  createProxy,
} from '#packages/temporal/intrinsics.js'
import {defineGetters} from '#packages/temporal/accessors.js'
import {nativeTemporal} from '#packages/temporal/native.js'
import {localeDateTime} from '#packages/temporal/locale.js'
import {ToString} from '#packages/ecma262-abstract/ToString.js'
import {
  getYearMonthSlot,
  setYearMonthSlot,
  isoDateFields,
  type DateSlot,
} from '#packages/temporal/plain-slots.js'
import {
  calendarFromObject,
  constructorCalendar,
  dateFields,
  dateFieldsView,
  dateProperty,
  readDateFields,
  partialObject,
  integer,
  object,
  overflowOption,
  nsPerDay,
  dateUntil,
  roundedDateTimeDifference,
  dayFromFields,
} from '#packages/temporal/date-core.js'
import {
  addNormalizedCalendarDate,
  calendarToEpochDayRaw,
  dayCheck,
} from '#packages/temporal/calendar.js'
import {
  createPlainDate,
  type PlainDateObject,
  type DateProperties,
} from '#packages/temporal/plain-date.js'
import {
  toDurationFields,
  toNativeDurationFields,
  createDuration,
  createNativeDuration,
  type DurationObject,
} from '#packages/temporal/duration.js'
import {durationFieldNames} from '#packages/temporal/duration-core.js'
import {
  optionsObject,
  unitOption,
  roundingIncrement,
  roundingMode,
} from '#packages/temporal/rounding.js'
import {
  shortCalendar,
  isoReferenceDay,
  checkYearMonth,
  yearMonthFields,
  parseShortSlot,
  formatShortDate,
  mergeShortFields,
} from '#packages/temporal/short-date-core.js'

export interface PlainYearMonthObject extends Pick<
  DateProperties,
  | 'calendarId'
  | 'era'
  | 'eraYear'
  | 'year'
  | 'month'
  | 'monthCode'
  | 'daysInMonth'
  | 'daysInYear'
  | 'monthsInYear'
  | 'inLeapYear'
> {
  readonly [Symbol.toStringTag]: 'Temporal.PlainYearMonth'
  with(item: unknown, options?: unknown): PlainYearMonthObject
  add(duration: unknown, options?: unknown): PlainYearMonthObject
  subtract(duration: unknown, options?: unknown): PlainYearMonthObject
  until(other: unknown, options?: unknown): DurationObject
  since(other: unknown, options?: unknown): DurationObject
  equals(other: unknown): boolean
  toPlainDate(item: unknown): PlainDateObject
  toString(options?: unknown): string
  toLocaleString(locales?: unknown, options?: unknown): string
  toJSON(): string
  valueOf(): never
}
export interface PlainYearMonthConstructor {
  new (
    year: unknown,
    month: unknown,
    calendar?: unknown,
    referenceISODay?: unknown
  ): PlainYearMonthObject
  readonly prototype: PlainYearMonthObject
  from(item: unknown, options?: unknown): PlainYearMonthObject
  compare(one: unknown, two: unknown): -1 | 0 | 1
}
function read(item: unknown): DateSlot {
  const slot = getYearMonthSlot(item as object)
  if (!slot) throw new TypeErrorConstructor('Invalid PlainYearMonth receiver')
  return slot
}
export function createPlainYearMonth(slot: DateSlot): PlainYearMonthObject {
  checkYearMonth(slot.epochDay)
  const result = createObject(
    PlainYearMonthValue.prototype
  ) as PlainYearMonthObject
  setYearMonthSlot(result, slot)
  return result
}
export function toYearMonthSlot(item: unknown, options?: unknown): DateSlot {
  const existing = getYearMonthSlot(item as object)
  if (existing) {
    overflowOption(options)
    return existing
  }
  if (object(item)) {
    const calendar = calendarFromObject(item)
    const fields = readDateFields(item, false, false, 'year-month', calendar),
      overflow = overflowOption(options)
    return yearMonthFields(calendar, fields, overflow)
  }
  if (typeof item !== 'string')
    throw new TypeErrorConstructor('Expected year-month string or object')
  return parseShortSlot(item, 'year-month', options)
}
function add(
  slot: DateSlot,
  duration: unknown,
  options: unknown,
  sign: number
): PlainYearMonthObject {
  const fields =
      import.meta.formatjsTemporalNativeData === true
        ? toNativeDurationFields(duration)
        : toDurationFields(duration),
    native = nativeTemporal()
  if (import.meta.formatjsTemporalNativeData === true || native)
    return createPlainYearMonth(
      native!.addPlainYearMonth(slot, fields, sign < 0, overflowOption(options))
    )
  for (let index = 0; index < durationFieldNames.length; index++)
    fields[durationFieldNames[index]] *= sign
  const overflow = overflowOption(options)
  if (
    fields.weeks ||
    fields.days ||
    fields.hours ||
    fields.minutes ||
    fields.seconds ||
    fields.milliseconds ||
    fields.microseconds ||
    fields.nanoseconds
  )
    throw new RangeErrorConstructor(
      'Year-month arithmetic only accepts years and months'
    )
  const cal = shortCalendar(slot.calendar),
    start = {...dateFieldsView(slot, true), day: 1}
  const firstDay = calendarToEpochDayRaw(cal, start, 'constrain')
  if (firstDay < -100000001 || firstDay > 100000000)
    throw new RangeErrorConstructor('Reference date out of range')
  const result = addNormalizedCalendarDate(cal, start, fields, overflow)
  dayCheck(result.epochDay)
  return createPlainYearMonth({
    epochDay: checkYearMonth(result.epochDay),
    calendar: slot.calendar,
    [isoDateFields]: cal === 'iso8601' ? result.date : undefined,
  })
}
function difference(
  slot: DateSlot,
  other: unknown,
  options: unknown,
  since: boolean
): DurationObject {
  const end = toYearMonthSlot(other)
  if (slot.calendar !== end.calendar)
    throw new RangeErrorConstructor('Calendars differ')
  const resolved = optionsObject(options),
    rawLargest = resolved.largestUnit
  const text = rawLargest === undefined ? 'auto' : ToString(rawLargest),
    largest = text === 'auto' ? 'year' : unitOption(text)
  const increment = roundingIncrement(resolved.roundingIncrement),
    mode = roundingMode(resolved.roundingMode, 'trunc'),
    smallest = unitOption(resolved.smallestUnit) ?? 'month'
  if (
    (largest !== 'year' && largest !== 'month') ||
    (smallest !== 'year' && smallest !== 'month') ||
    (largest === 'month' && smallest === 'year')
  )
    throw new RangeErrorConstructor('Invalid year-month units')
  const native = nativeTemporal()
  if (import.meta.formatjsTemporalNativeData === true || native)
    return (
      import.meta.formatjsTemporalNativeData === true
        ? createNativeDuration
        : createDuration
    )(
      native!.differencePlainYearMonth(
        slot,
        end,
        largest,
        smallest,
        increment,
        mode,
        since
      )
    )
  if (slot.epochDay === end.epochDay)
    return createDuration({
      years: 0,
      months: 0,
      weeks: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      milliseconds: 0,
      microseconds: 0,
      nanoseconds: 0,
    })
  const a = yearMonthFields(
      slot.calendar,
      {__proto__: null, ...dateFields(slot, true)},
      'constrain'
    ),
    b = yearMonthFields(
      end.calendar,
      {__proto__: null, ...dateFields(end, true)},
      'constrain'
    )
  if (
    a.epochDay < -100000001 ||
    a.epochDay > 100000000 ||
    b.epochDay < -100000001 ||
    b.epochDay > 100000000
  )
    throw new RangeErrorConstructor('Reference date out of range')
  if (smallest === 'month' && increment === 1) {
    const fields = dateUntil(a, b.epochDay, largest)
    fields.days = 0
    if (since) {
      fields.years = -fields.years || 0
      fields.months = -fields.months || 0
    }
    return createDuration(fields)
  }
  return createDuration(
    roundedDateTimeDifference(
      bigIntFrom(a.epochDay) * nsPerDay,
      bigIntFrom(b.epochDay) * nsPerDay,
      slot.calendar,
      largest,
      smallest,
      increment,
      mode,
      since
    )
  )
}
class PlainYearMonthValue {
  constructor(
    _year: unknown,
    _month: unknown,
    _calendar: unknown = undefined,
    _referenceISODay?: unknown
  ) {
    throw new TypeErrorConstructor('Use exported PlainYearMonth constructor')
  }
  static from(
    item: unknown,
    options: unknown = undefined
  ): PlainYearMonthObject {
    // Temporal comparison §9.2.2 step 1.
    // https://tc39.es/proposal-temporal/#sec-temporal.plainyearmonth.from
    return createPlainYearMonth(toYearMonthSlot(item, options))
  }
  static compare(one: unknown, two: unknown): -1 | 0 | 1 {
    // Temporal comparison §9.2.3 steps 1–3.
    // https://tc39.es/proposal-temporal/#sec-temporal.plainyearmonth.compare
    const a = toYearMonthSlot(one).epochDay,
      b = toYearMonthSlot(two).epochDay
    return a < b ? -1 : a > b ? 1 : 0
  }
  with(item: unknown, options: unknown = undefined): PlainYearMonthObject {
    // Temporal comparison §9.3.13 steps 1–11.
    // https://tc39.es/proposal-temporal/#sec-temporal.plainyearmonth.prototype.with
    const slot = read(this),
      partial = readDateFields(
        partialObject(item),
        false,
        true,
        'year-month',
        slot.calendar
      )
    const native = nativeTemporal()
    if (import.meta.formatjsTemporalNativeData === true || native) {
      dateFields(slot, true)
      return createPlainYearMonth(
        native!.withDate(slot, partial, overflowOption(options), 'year-month')
      )
    }
    return createPlainYearMonth(
      yearMonthFields(
        slot.calendar,
        mergeShortFields(slot, partial),
        overflowOption(options)
      )
    )
  }
  add(duration: unknown, options: unknown = undefined): PlainYearMonthObject {
    // Temporal comparison §9.3.14 steps 1–3.
    // https://tc39.es/proposal-temporal/#sec-temporal.plainyearmonth.prototype.add
    return add(read(this), duration, options, 1)
  }
  subtract(
    duration: unknown,
    options: unknown = undefined
  ): PlainYearMonthObject {
    // Temporal comparison §9.3.15 steps 1–3.
    // https://tc39.es/proposal-temporal/#sec-temporal.plainyearmonth.prototype.subtract
    return add(read(this), duration, options, -1)
  }
  until(other: unknown, options: unknown = undefined): DurationObject {
    // Temporal comparison §9.3.16 steps 1–3.
    // https://tc39.es/proposal-temporal/#sec-temporal.plainyearmonth.prototype.until
    return difference(read(this), other, options, false)
  }
  since(other: unknown, options: unknown = undefined): DurationObject {
    // Temporal comparison §9.3.17 steps 1–3.
    // https://tc39.es/proposal-temporal/#sec-temporal.plainyearmonth.prototype.since
    return difference(read(this), other, options, true)
  }
  equals(other: unknown): boolean {
    // Temporal comparison §9.3.18 steps 1–5.
    // https://tc39.es/proposal-temporal/#sec-temporal.plainyearmonth.prototype.equals
    const a = read(this),
      b = toYearMonthSlot(other)
    return a.epochDay === b.epochDay && a.calendar === b.calendar
  }
  toPlainDate(item: unknown): PlainDateObject {
    // Temporal comparison §9.3.23 steps 1–9.
    // https://tc39.es/proposal-temporal/#sec-temporal.plainyearmonth.prototype.toplaindate
    const slot = read(this)
    if (!object(item)) throw new TypeErrorConstructor('Expected date fields')
    const raw = item.day
    if (raw === undefined) throw new TypeErrorConstructor('Day required')
    const day = integer(raw)
    if (day <= 0) throw new RangeErrorConstructor('Day must be positive')
    const native = nativeTemporal()
    if (import.meta.formatjsTemporalNativeData === true || native)
      return createPlainDate(native!.yearMonthToDate(slot, day), slot.calendar)
    return createPlainDate(
      dayFromFields(
        slot.calendar,
        // Temporal comparison §9.3.23 steps 7–8: merge private field records.
        {__proto__: null, ...dateFields(slot, true), day},
        'constrain'
      ),
      slot.calendar
    )
  }
  toString(options: unknown = undefined): string {
    // Temporal comparison §9.3.19 steps 1–5.
    // https://tc39.es/proposal-temporal/#sec-temporal.plainyearmonth.prototype.tostring
    const slot = read(this)
    return formatShortDate(
      slot,
      'year-month',
      optionsObject(options).calendarName
    )
  }
  toLocaleString(
    locales: unknown = undefined,
    options: unknown = undefined
  ): string {
    // Temporal comparison §9.3.20 steps 1–3.
    // https://tc39.es/proposal-temporal/#sec-temporal.plainyearmonth.prototype.tolocalestring
    const slot = read(this)
    return localeDateTime(
      {
        kind: 'PlainYearMonth',
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
    // Temporal comparison §9.3.21 steps 1–3.
    // https://tc39.es/proposal-temporal/#sec-temporal.plainyearmonth.prototype.tojson
    return formatShortDate(read(this), 'year-month')
  }
  valueOf(): never {
    // Temporal comparison §9.3.22 step 1.
    // https://tc39.es/proposal-temporal/#sec-temporal.plainyearmonth.prototype.valueof
    throw new TypeErrorConstructor(
      'Cannot convert Temporal.PlainYearMonth to primitive'
    )
  }
}
const localeStringIntrinsic = PlainYearMonthValue.prototype.toString

Object.defineProperty(PlainYearMonthValue, 'name', {
  value: 'PlainYearMonth',
  configurable: true,
})
// Temporal comparison §9.2.1.
// https://tc39.es/proposal-temporal/#sec-temporal.plainyearmonth.prototype
export const PlainYearMonth: PlainYearMonthConstructor = createProxy(
  PlainYearMonthValue,
  {
    construct(target, args, newTarget) {
      // Temporal comparison §9.1.1 steps 1–11.
      // https://tc39.es/proposal-temporal/#sec-temporal.plainyearmonth
      const year = integer(argumentAt(args, 0)),
        month = integer(argumentAt(args, 1)),
        calendar = constructorCalendar(argumentAt(args, 2)),
        day =
          argumentAt(args, 3) === undefined ? 1 : integer(argumentAt(args, 3))
      const epochDay = checkYearMonth(isoReferenceDay(year, month, day)),
        prototype = constructorPrototype(newTarget, target)
      const result = createObject(prototype)
      setYearMonthSlot(result, {epochDay, calendar})
      return result
    },
  }
) as unknown as PlainYearMonthConstructor
Object.defineProperties(PlainYearMonthValue.prototype, {
  // Temporal comparison §9.3.1.
  // https://tc39.es/proposal-temporal/#sec-temporal.plainyearmonth.prototype.constructor
  constructor: {value: PlainYearMonth, writable: true, configurable: true},
  // Temporal comparison §9.3.2.
  // https://tc39.es/proposal-temporal/#sec-temporal.plainyearmonth.prototype-%symbol.tostringtag%
  [Symbol.toStringTag]: {value: 'Temporal.PlainYearMonth', configurable: true},
})
// Temporal comparison §9.3.3 steps 1–3.
// https://tc39.es/proposal-temporal/#sec-get-temporal.plainyearmonth.prototype.calendarid
// Temporal comparison §9.3.4 steps 1–3.
// https://tc39.es/proposal-temporal/#sec-get-temporal.plainyearmonth.prototype.era
// Temporal comparison §9.3.5 steps 1–5.
// https://tc39.es/proposal-temporal/#sec-get-temporal.plainyearmonth.prototype.erayear
// Temporal comparison §9.3.6 steps 1–3.
// https://tc39.es/proposal-temporal/#sec-get-temporal.plainyearmonth.prototype.year
// Temporal comparison §9.3.7 steps 1–3.
// https://tc39.es/proposal-temporal/#sec-get-temporal.plainyearmonth.prototype.month
// Temporal comparison §9.3.8 steps 1–3.
// https://tc39.es/proposal-temporal/#sec-get-temporal.plainyearmonth.prototype.monthcode
// Temporal comparison §9.3.9 steps 1–3.
// https://tc39.es/proposal-temporal/#sec-get-temporal.plainyearmonth.prototype.daysinyear
// Temporal comparison §9.3.10 steps 1–3.
// https://tc39.es/proposal-temporal/#sec-get-temporal.plainyearmonth.prototype.daysinmonth
// Temporal comparison §9.3.11 steps 1–3.
// https://tc39.es/proposal-temporal/#sec-get-temporal.plainyearmonth.prototype.monthsinyear
// Temporal comparison §9.3.12 steps 1–3.
// https://tc39.es/proposal-temporal/#sec-get-temporal.plainyearmonth.prototype.inleapyear
defineGetters(
  PlainYearMonthValue.prototype,
  [
    'calendarId',
    'era',
    'eraYear',
    'year',
    'month',
    'monthCode',
    'daysInMonth',
    'daysInYear',
    'monthsInYear',
    'inLeapYear',
  ],
  (receiver, name) => dateProperty(read(receiver), name, true)
)
