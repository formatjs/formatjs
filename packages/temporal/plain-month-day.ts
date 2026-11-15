import {
  getMonthDaySlot,
  setMonthDaySlot,
  getDateSlot,
  getDateTimeSlot,
  type DateSlot,
} from '#packages/temporal/plain-slots.js'
import {
  calendarId,
  constructorCalendar,
  dateFields,
  dateProperty,
  readDateFields,
  partialObject,
  integer,
  object,
  overflowOption,
  dayFromFields,
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
  readonly calendarId: string
  readonly monthCode: string
  readonly day: number
  with(item: unknown, options?: unknown): PlainMonthDayObject
  equals(other: unknown): boolean
  toPlainDate(item: unknown): PlainDateObject
  toString(options?: unknown): string
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
function read(item: unknown): DateSlot {
  const slot = getMonthDaySlot(item as object)
  if (!slot) throw new TypeError('Invalid PlainMonthDay receiver')
  return slot
}
export function createPlainMonthDay(slot: DateSlot): PlainMonthDayObject {
  if (slot.epochDay < -100000001 || slot.epochDay > 100000000)
    throw new RangeError('Month-day out of range')
  const result = Object.create(
    PlainMonthDayValue.prototype
  ) as PlainMonthDayObject
  setMonthDaySlot(result, {...slot})
  return result
}
export function toMonthDaySlot(item: unknown, options?: unknown): DateSlot {
  const existing = getMonthDaySlot(item as object)
  if (existing) {
    overflowOption(options)
    return existing
  }
  if (object(item)) {
    const date = getDateSlot(item),
      datetime = getDateTimeSlot(item)
    const calendar = calendarId(
      (date ?? datetime) ? (date ?? datetime)!.calendar : item.calendar
    )
    const fields = readDateFields(item, false),
      overflow = overflowOption(options)
    return monthDayFields(calendar, fields, overflow)
  }
  if (typeof item !== 'string')
    throw new TypeError('Expected month-day string or object')
  const slot = parseShortSlot(item, 'month-day')
  overflowOption(options)
  return slot
}
class PlainMonthDayValue {
  constructor(
    _month: unknown,
    _day: unknown,
    _calendar: unknown = undefined,
    _referenceISOYear?: unknown
  ) {
    throw new TypeError('Use exported PlainMonthDay constructor')
  }
  static from(
    item: unknown,
    options: unknown = undefined
  ): PlainMonthDayObject {
    return createPlainMonthDay(toMonthDaySlot(item, options))
  }
  with(item: unknown, options: unknown = undefined): PlainMonthDayObject {
    const slot = read(this),
      partial = readDateFields(partialObject(item), false, true)
    return createPlainMonthDay(
      monthDayFields(
        slot.calendar,
        mergeShortFields(slot, partial),
        overflowOption(options)
      )
    )
  }
  equals(other: unknown): boolean {
    const a = read(this),
      b = toMonthDaySlot(other)
    return a.epochDay === b.epochDay && a.calendar === b.calendar
  }
  toPlainDate(item: unknown): PlainDateObject {
    const slot = read(this)
    if (!object(item)) throw new TypeError('Expected date fields')
    const raw = item.year
    if (raw === undefined) throw new TypeError('Year required')
    const year = integer(raw),
      fields = dateFields(slot, true)
    return createPlainDate(
      dayFromFields(
        slot.calendar,
        {year, monthCode: fields.monthCode, day: fields.day},
        'constrain'
      ),
      slot.calendar
    )
  }
  toString(options: unknown = undefined): string {
    const slot = read(this)
    return formatShortDate(
      slot,
      'month-day',
      optionsObject(options).calendarName
    )
  }
  toJSON(): string {
    return formatShortDate(read(this), 'month-day')
  }
  valueOf(): never {
    throw new TypeError('Cannot convert Temporal.PlainMonthDay to primitive')
  }
}
Object.defineProperty(PlainMonthDayValue, 'name', {
  value: 'PlainMonthDay',
  configurable: true,
})
export const PlainMonthDay: PlainMonthDayConstructor = new Proxy(
  PlainMonthDayValue,
  {
    construct(target, args, newTarget) {
      const month = integer(args[0]),
        day = integer(args[1]),
        calendar = constructorCalendar(args[2]),
        year = args[3] === undefined ? 1972 : integer(args[3])
      const epochDay = isoReferenceDay(year, month, day)
      if (epochDay < -100000001 || epochDay > 100000000)
        throw new RangeError('Month-day out of range')
      const prototype = Reflect.get(newTarget, 'prototype'),
        result = Object.create(object(prototype) ? prototype : target.prototype)
      setMonthDaySlot(result, {epochDay, calendar})
      return result
    },
  }
) as unknown as PlainMonthDayConstructor
Object.defineProperties(PlainMonthDayValue.prototype, {
  constructor: {value: PlainMonthDay, writable: true, configurable: true},
  [Symbol.toStringTag]: {value: 'Temporal.PlainMonthDay', configurable: true},
})
for (const name of ['calendarId', 'monthCode', 'day']) {
  const descriptor = Object.getOwnPropertyDescriptor(
    {
      get [name]() {
        return dateProperty(read(this), name, true)
      },
    },
    name
  )!
  Object.defineProperty(PlainMonthDayValue.prototype, name, {
    ...descriptor,
    enumerable: false,
  })
}
