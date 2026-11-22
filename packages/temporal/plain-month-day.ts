import {
  RangeErrorConstructor,
  TypeErrorConstructor,
  bigIntFrom,
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
  getMonthDaySlot,
  allocateMonthDay,
  type DateSlot,
} from '#packages/temporal/plain-slots.js'
import {
  calendarFromObject,
  constructorCalendar,
  dateFields,
  dateProperty,
  readDateFields,
  partialObject,
  integer,
  object,
  overflowOption,
  dayFromFields,
  resolveCalendarYear,
} from '#packages/temporal/date-core.js'
import {
  createPlainDate,
  type PlainDateObject,
} from '#packages/temporal/plain-date.js'
import {optionsObject} from '#packages/temporal/rounding.js'
import {
  isoReferenceDay,
  monthDayFields,
  parseShortSlot,
  formatShortDate,
  mergeShortFields,
} from '#packages/temporal/short-date-core.js'

export interface PlainMonthDayObject {
  readonly [Symbol.toStringTag]: 'Temporal.PlainMonthDay'
  readonly calendarId: string
  readonly monthCode: string
  readonly day: number
  with(item: unknown, options?: unknown): PlainMonthDayObject
  equals(other: unknown): boolean
  toPlainDate(item: unknown): PlainDateObject
  toString(options?: unknown): string
  toLocaleString(locales?: unknown, options?: unknown): string
  toJSON(): string
  valueOf(): never
}
export interface PlainMonthDayConstructor {
  new (
    month: unknown,
    day: unknown,
    calendar?: unknown,
    referenceISOYear?: unknown
  ): PlainMonthDayObject
  readonly prototype: PlainMonthDayObject
  from(item: unknown, options?: unknown): PlainMonthDayObject
}
// Temporal comparison §10.3.3 step 2.
// Check the PlainMonthDay receiver before reading its calendar.
function read(item: unknown): DateSlot {
  const slot = getMonthDaySlot(item as object)
  if (!slot) throw new TypeErrorConstructor('Invalid PlainMonthDay receiver')
  return slot
}
// Temporal comparison §10.5.2 steps 1–5. Allocate with the local prototype.
export function createPlainMonthDay(slot: DateSlot): PlainMonthDayObject {
  if (slot.epochDay < -100000001 || slot.epochDay > 100000000)
    throw new RangeErrorConstructor('Month-day out of range')
  return allocateMonthDay(
    PlainMonthDayValue.prototype,
    slot
  ) as PlainMonthDayObject
}
// Temporal comparison §10.5.1 steps 3, 4, 8, 9.
// Delegate month-day parsing with prepared options.
export function toMonthDaySlot(item: unknown, options?: unknown): DateSlot {
  const existing = getMonthDaySlot(item as object)
  if (existing) {
    overflowOption(options)
    return existing
  }
  if (object(item)) {
    const calendar = calendarFromObject(item)
    const fields = readDateFields(item, false, false, 'date', calendar),
      overflow = overflowOption(options)
    return monthDayFields(calendar, fields, overflow)
  }
  if (typeof item !== 'string')
    throw new TypeErrorConstructor('Expected month-day string or object')
  return parseShortSlot(item, 'month-day', options)
}
class PlainMonthDayValue {
  constructor(
    _month: unknown,
    _day: unknown,
    _calendar: unknown = undefined,
    _referenceISOYear?: unknown
  ) {
    throw new TypeErrorConstructor('Use exported PlainMonthDay constructor')
  }
  static from(
    item: unknown,
    options: unknown = undefined
  ): PlainMonthDayObject {
    // Temporal comparison §10.2.2 step 1.
    // https://tc39.es/proposal-temporal/#sec-temporal.plainmonthday.from
    return createPlainMonthDay(toMonthDaySlot(item, options))
  }
  with(item: unknown, options: unknown = undefined): PlainMonthDayObject {
    // Temporal comparison §10.3.6 steps 1–11.
    // https://tc39.es/proposal-temporal/#sec-temporal.plainmonthday.prototype.with
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
      dateFields(slot, true)
      return createPlainMonthDay(
        native!.withDate(slot, partial, overflowOption(options), 'month-day')
      )
    }
    return createPlainMonthDay(
      monthDayFields(
        slot.calendar,
        mergeShortFields(slot, partial, 'month-day'),
        overflowOption(options)
      )
    )
  }
  equals(other: unknown): boolean {
    // Temporal comparison §10.3.7 steps 1–5.
    // https://tc39.es/proposal-temporal/#sec-temporal.plainmonthday.prototype.equals
    const a = read(this),
      b = toMonthDaySlot(other)
    return a.epochDay === b.epochDay && a.calendar === b.calendar
  }
  toPlainDate(item: unknown): PlainDateObject {
    // Temporal comparison §10.3.12 steps 1–9.
    // https://tc39.es/proposal-temporal/#sec-temporal.plainmonthday.prototype.toplaindate
    const slot = read(this)
    if (!object(item)) throw new TypeErrorConstructor('Expected date fields')
    // Temporal comparison §10.3.12 steps7–8: merge only prepared private fields.
    const prepared = readDateFields(item, false, false, 'year', slot.calendar),
      fields = dateFields(slot, true)
    const native = nativeTemporal()
    if (import.meta.formatjsTemporalNativeData === true || native)
      return createPlainDate(
        native!.monthDayToDate(
          slot,
          resolveCalendarYear(slot.calendar, {
            __proto__: null,
            monthCode: fields.monthCode,
            day: fields.day,
            ...prepared,
          })!
        ),
        slot.calendar
      )
    return createPlainDate(
      dayFromFields(
        slot.calendar,
        {
          __proto__: null,
          monthCode: fields.monthCode,
          day: fields.day,
          ...prepared,
        },
        'constrain'
      ),
      slot.calendar
    )
  }
  toString(options: unknown = undefined): string {
    // Temporal comparison §10.3.8 steps 1–5.
    // https://tc39.es/proposal-temporal/#sec-temporal.plainmonthday.prototype.tostring
    const slot = read(this)
    return formatShortDate(
      slot,
      'month-day',
      optionsObject(options).calendarName
    )
  }
  toLocaleString(
    locales: unknown = undefined,
    options: unknown = undefined
  ): string {
    // Temporal comparison §10.3.9 steps 1–3.
    // https://tc39.es/proposal-temporal/#sec-temporal.plainmonthday.prototype.tolocalestring
    const slot = read(this)
    return localeDateTime(
      {
        kind: 'PlainMonthDay',
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
    // Temporal comparison §10.3.10 steps 1–3.
    // https://tc39.es/proposal-temporal/#sec-temporal.plainmonthday.prototype.tojson
    return formatShortDate(read(this), 'month-day')
  }
  valueOf(): never {
    // Temporal comparison §10.3.11 step 1.
    // https://tc39.es/proposal-temporal/#sec-temporal.plainmonthday.prototype.valueof
    throw new TypeErrorConstructor(
      'Cannot convert Temporal.PlainMonthDay to primitive'
    )
  }
}
const localeStringIntrinsic = PlainMonthDayValue.prototype.toString

Object.defineProperty(PlainMonthDayValue, 'name', {
  value: 'PlainMonthDay',
  configurable: true,
})
// Temporal comparison §10.2.1.
// https://tc39.es/proposal-temporal/#sec-temporal.plainmonthday.prototype
export const PlainMonthDay: PlainMonthDayConstructor = createProxy(
  PlainMonthDayValue,
  {
    construct(target, args, newTarget) {
      // Temporal comparison §10.1.1 steps 1–11.
      // https://tc39.es/proposal-temporal/#sec-temporal.plainmonthday
      const month = integer(argumentAt(args, 0)),
        day = integer(argumentAt(args, 1)),
        calendar = constructorCalendar(argumentAt(args, 2)),
        year =
          argumentAt(args, 3) === undefined
            ? 1972
            : integer(argumentAt(args, 3))
      const epochDay = isoReferenceDay(year, month, day)
      if (epochDay < -100000001 || epochDay > 100000000)
        throw new RangeErrorConstructor('Month-day out of range')
      const prototype = constructorPrototype(newTarget, target)
      return allocateMonthDay(prototype, {epochDay, calendar})
    },
  }
) as unknown as PlainMonthDayConstructor
Object.defineProperties(PlainMonthDayValue.prototype, {
  // Temporal comparison §10.3.1.
  // https://tc39.es/proposal-temporal/#sec-temporal.plainmonthday.prototype.constructor
  constructor: {value: PlainMonthDay, writable: true, configurable: true},
  // Temporal comparison §10.3.2.
  // https://tc39.es/proposal-temporal/#sec-temporal.plainmonthday.prototype-%symbol.tostringtag%
  [Symbol.toStringTag]: {value: 'Temporal.PlainMonthDay', configurable: true},
})
// Temporal comparison §10.3.3 steps 1–3.
// https://tc39.es/proposal-temporal/#sec-get-temporal.plainmonthday.prototype.calendarid
// Temporal comparison §10.3.4 steps 1–3.
// https://tc39.es/proposal-temporal/#sec-get-temporal.plainmonthday.prototype.monthcode
// Temporal comparison §10.3.5 steps 1–3.
// https://tc39.es/proposal-temporal/#sec-get-temporal.plainmonthday.prototype.day
defineGetters(
  PlainMonthDayValue.prototype,
  ['calendarId', 'monthCode', 'day'],
  (receiver, name) => dateProperty(read(receiver), name, true)
)
