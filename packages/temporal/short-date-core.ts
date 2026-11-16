import {nativeTemporal} from '#packages/temporal/native.js'
import {ToString} from '#packages/ecma262-abstract/ToString.js'
import {
  calendarFromEpochDayRaw,
  calendarToEpochDayRaw,
  daysInMonth,
  calendarStartOfYear,
  type CalendarId,
  type Overflow,
} from '#packages/temporal/calendar.js'
import {
  calendarAnnotation,
  dateFields,
  constructorCalendar,
  resolveCalendarYear,
  mergeDateFields,
} from '#packages/temporal/date-core.js'
import type {DateSlot} from '#packages/temporal/plain-slots.js'
import {parseShortDateString} from '#packages/temporal/instant-string.js'

export function shortCalendar(calendar: string): CalendarId {
  return calendar as CalendarId
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
  const year = resolveCalendarYear(calendar, fields, 'year-month')!
  const epochDay = calendarToEpochDayRaw(
    shortCalendar(calendar),
    {
      year,
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
  const cal = shortCalendar(calendar)
  let year = resolveCalendarYear(calendar, fields, 'month-day')
  let day = fields.day as number,
    code = fields.monthCode as string | undefined
  if (calendar === 'iso8601') {
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
    const month = calendarFromEpochDayRaw(cal, monthDay).month
    year ??= 1972
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
  if (year !== undefined) {
    if (
      calendarStartOfYear(cal, year) > 100000000 ||
      calendarStartOfYear(cal, year + 1) <= -100000001
    )
      throw new RangeError('Calendar year out of range')
    const epoch = calendarToEpochDayRaw(
      cal,
      {
        year,
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
  const lunisolar = calendar === 'chinese' || calendar === 'dangi'
  if (lunisolar) {
    if (day > 30 && overflow === 'reject')
      throw new RangeError('Day out of range')
    day = Math.min(day, 30)
    if (
      code!.endsWith('L') &&
      (code === 'M01L' ||
        code === 'M12L' ||
        (day === 30 &&
          ['M02L', 'M08L', 'M09L', 'M10L', 'M11L'].includes(code!)))
    ) {
      if (overflow === 'reject') throw new RangeError('Invalid month-day')
      code = code!.slice(0, -1)
    }
  }
  let best: number | undefined,
    maximumDay = 0
  for (let range = 0; range < 2; range++) {
    const descending = range === 0,
      minimum = isoReferenceDay(descending ? 1900 : 1973, 1, 1),
      maximum = isoReferenceDay(descending ? 1972 : 2035, 12, 31),
      first = calendarFromEpochDayRaw(cal, minimum).year,
      latest = calendarFromEpochDayRaw(cal, maximum).year
    for (
      let candidate = descending ? latest : first;
      descending ? candidate >= first : candidate <= latest;
      candidate += descending ? -1 : 1
    ) {
      let start: number
      try {
        start = calendarToEpochDayRaw(
          cal,
          {year: candidate, monthCode: code, day: 1},
          'reject'
        )
      } catch (error) {
        if (!(error instanceof RangeError)) throw error
        continue
      }
      const month = calendarFromEpochDayRaw(cal, start).month,
        length = daysInMonth(cal, candidate, month),
        validDay = Math.min(day, length),
        epoch = start + validDay - 1
      if (epoch < minimum || epoch > maximum) continue
      if (validDay === day) return {epochDay: epoch, calendar}
      if (validDay > maximumDay) {
        maximumDay = validDay
        best = epoch
      }
    }
  }
  if (overflow === 'constrain' && best !== undefined)
    return {epochDay: best, calendar}
  throw new RangeError('Invalid month-day')
}

export function parseShortSlot(
  value: string,
  kind: 'year-month' | 'month-day'
): DateSlot {
  const native = nativeTemporal()
  if (native)
    return kind === 'year-month'
      ? native.parsePlainYearMonth(value)
      : native.parsePlainMonthDay(value)
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
  partial: Record<string, unknown>,
  kind: 'year-month' | 'month-day' = 'year-month'
): Record<string, unknown> {
  const fields: Record<string, unknown> = {...dateFields(slot, true)}
  if (kind === 'month-day') delete fields.year
  else delete fields.day
  return mergeDateFields(slot.calendar, fields, partial)
}
