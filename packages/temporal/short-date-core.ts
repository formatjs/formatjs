import {ToString} from '#packages/ecma262-abstract/ToString.js'
import {
  calendarFromEpochDayRaw,
  calendarToEpochDayRaw,
  daysInMonth,
  type CalendarId,
  type Overflow,
} from '#packages/temporal/calendar.js'
import {
  calendarAnnotation,
  dateFields,
  constructorCalendar,
} from '#packages/temporal/date-core.js'
import type {DateSlot} from '#packages/temporal/plain-slots.js'
import {parseShortDateString} from '#packages/temporal/instant-string.js'

export function shortCalendar(calendar: string): CalendarId {
  return calendar === 'gregory' ? 'iso8601' : (calendar as CalendarId)
}
export function isoReferenceDay(
  year: number,
  month: number,
  day: number
): number {
  return calendarToEpochDayRaw('iso8601', {year, month, day}, 'reject')
}
export function checkYearMonth(epochDay: number): number {
  const {year, month} = calendarFromEpochDayRaw('iso8601', epochDay)
  if (
    year < -271821 ||
    year > 275760 ||
    (year === -271821 && month < 4) ||
    (year === 275760 && month > 9)
  )
    throw new RangeError('Year-month out of range')
  return epochDay
}
export function yearMonthFields(
  calendar: string,
  fields: Record<string, unknown>,
  overflow: Overflow
): DateSlot {
  if (fields.year === undefined) throw new TypeError('Year required')
  const epochDay = calendarToEpochDayRaw(
    shortCalendar(calendar),
    {
      year: fields.year as number,
      month: fields.month as number | undefined,
      monthCode: fields.monthCode as string | undefined,
      day: 1,
    },
    overflow
  )
  return {epochDay: checkYearMonth(epochDay), calendar}
}
export function monthDayFields(
  calendar: string,
  fields: Record<string, unknown>,
  overflow: Overflow
): DateSlot {
  if (fields.day === undefined) throw new TypeError('Day required')
  const cal = shortCalendar(calendar)
  if (
    calendar !== 'iso8601' &&
    fields.year !== undefined &&
    cal === 'iso8601' &&
    ((fields.year as number) < -271821 || (fields.year as number) > 275760)
  )
    throw new RangeError('Calendar year out of range')
  let day = fields.day as number,
    code = fields.monthCode as string | undefined
  if (cal === 'iso8601') {
    const monthDay = calendarToEpochDayRaw(
      cal,
      {
        year: 1972,
        month: fields.month as number | undefined,
        monthCode: code,
        day: 1,
      },
      overflow
    )
    const month = calendarFromEpochDayRaw(cal, monthDay).month,
      year = (fields.year ?? 1972) as number
    const maximum =
      month === 2
        ? 28 + Number(year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0))
        : daysInMonth(cal, 1972, month)
    if (day > maximum && overflow === 'reject')
      throw new RangeError('Day out of range')
    return {
      epochDay: isoReferenceDay(1972, month, Math.min(day, maximum)),
      calendar,
    }
  }
  if (fields.year !== undefined) {
    const epoch = calendarToEpochDayRaw(
      cal,
      {
        year: (fields.year ?? 1972) as number,
        month: fields.month as number | undefined,
        monthCode: code,
        day,
      },
      overflow
    )
    const normalized = calendarFromEpochDayRaw(cal, epoch)
    code = normalized.monthCode
    day = normalized.day
  } else if (code === undefined)
    throw new TypeError('monthCode or year required')
  const maximum = isoReferenceDay(1972, 12, 31),
    latest = calendarFromEpochDayRaw(cal, maximum).year
  if (day > 30) {
    if (overflow === 'reject') throw new RangeError('Day out of range')
    day = 30
  }
  for (let year = latest; year > latest - 100; year--) {
    let epoch: number
    try {
      epoch = calendarToEpochDayRaw(cal, {year, monthCode: code, day}, 'reject')
    } catch (error) {
      if (!(error instanceof RangeError)) throw error
      continue
    }
    if (epoch <= maximum) return {epochDay: epoch, calendar}
  }
  throw new RangeError('Invalid month-day')
}
export function parseShortSlot(
  value: string,
  kind: 'year-month' | 'month-day'
): DateSlot {
  const parsed = parseShortDateString(value, kind),
    calendar = constructorCalendar(parsed.calendar)
  if (
    kind === 'month-day' &&
    calendar !== 'iso8601' &&
    (parsed.year < -271821 || parsed.year > 275760)
  )
    throw new RangeError('Date out of range')
  if (kind === 'month-day' && shortCalendar(calendar) === 'iso8601')
    return monthDayFields(
      calendar,
      parsed as unknown as Record<string, unknown>,
      'constrain'
    )
  const epochDay = isoReferenceDay(parsed.year, parsed.month, parsed.day)
  if (kind === 'year-month') {
    checkYearMonth(epochDay)
    return yearMonthFields(
      calendar,
      dateFields({epochDay, calendar}, true) as unknown as Record<
        string,
        unknown
      >,
      'constrain'
    )
  }
  return monthDayFields(
    calendar,
    dateFields({epochDay, calendar}, true) as unknown as Record<
      string,
      unknown
    >,
    'constrain'
  )
}
export function formatShortDate(
  slot: DateSlot,
  kind: 'year-month' | 'month-day',
  calendarName: unknown = undefined
): string {
  const option = calendarName === undefined ? 'auto' : ToString(calendarName)
  const annotation = calendarAnnotation(slot.calendar, option)
  const fields = calendarFromEpochDayRaw('iso8601', slot.epochDay)
  const year =
    fields.year >= 0 && fields.year <= 9999
      ? String(fields.year).padStart(4, '0')
      : (fields.year < 0 ? '-' : '+') +
        String(Math.abs(fields.year)).padStart(6, '0')
  const month = String(fields.month).padStart(2, '0'),
    day = String(fields.day).padStart(2, '0')
  const full =
    slot.calendar !== 'iso8601' || option === 'always' || option === 'critical'
  return (
    (kind === 'year-month'
      ? `${year}-${month}${full ? '-' + day : ''}`
      : `${full ? year + '-' : ''}${month}-${day}`) + annotation
  )
}
export function mergeShortFields(
  slot: DateSlot,
  partial: Record<string, unknown>
): Record<string, unknown> {
  const result: Record<string, unknown> = {
    ...dateFields(slot, true),
    ...partial,
  }
  if (partial.month !== undefined && partial.monthCode === undefined)
    delete result.monthCode
  if (partial.monthCode !== undefined && partial.month === undefined)
    delete result.month
  return result
}
