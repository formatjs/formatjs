import {
  RangeErrorConstructor,
  TypeErrorConstructor,
  mathMin,
  numberFrom,
  numberIsInteger,
} from '#packages/ecma262-abstract/intrinsics.js'
import {nativeTemporal} from '#packages/temporal/native.js'
import {ArithmeticCalendarToEpochDay} from '#packages/ecma402-abstract/Calendar/Arithmetic.js'
import {
  calendarFromEpochDayRaw,
  cachedISODateFields,
  calendarToEpochDayRaw,
  daysInMonth,
  calendarStartOfYear,
  type CalendarId,
  type Overflow,
} from '#packages/temporal/calendar.js'
import {
  calendarNameOption,
  formatISODate,
  dateFields,
  constructorCalendar,
  resolveCalendarYear,
  mergeDateFields,
  overflowOption,
} from '#packages/temporal/date-core.js'
import {isoDateFields, type DateSlot} from '#packages/temporal/plain-slots.js'
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
  // Inclusive ISO months at Temporal's year-month limits.
  if (
    !numberIsInteger(epochDay) ||
    epochDay < -100000019 ||
    epochDay > 100000017
  )
    throw new RangeErrorConstructor('Year-month out of range')
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
        ? 28 +
          numberFrom(year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0))
        : daysInMonth(cal, 1972, month)
    if (day > maximum && overflow === 'reject')
      throw new RangeErrorConstructor('Day out of range')
    return {
      epochDay: isoReferenceDay(1972, month, mathMin(day, maximum)),
      calendar,
    }
  }
  if (year !== undefined) {
    if (
      calendarStartOfYear(cal, year) > 100000000 ||
      calendarStartOfYear(cal, year + 1) <= -100000001
    )
      throw new RangeErrorConstructor('Calendar year out of range')
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
    throw new TypeErrorConstructor('monthCode or year required')
  const lunisolar = calendar === 'chinese' || calendar === 'dangi'
  if (lunisolar) {
    if (day > 30 && overflow === 'reject')
      throw new RangeErrorConstructor('Day out of range')
    day = mathMin(day, 30)
    if (
      code!.endsWith('L') &&
      (code === 'M01L' ||
        code === 'M12L' ||
        (day === 30 &&
          ['M02L', 'M08L', 'M09L', 'M10L', 'M11L'].includes(code!)))
    ) {
      if (overflow === 'reject')
        throw new RangeErrorConstructor('Invalid month-day')
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
        if (!(error instanceof RangeErrorConstructor)) throw error
        continue
      }
      const month = calendarFromEpochDayRaw(cal, start).month,
        length = daysInMonth(cal, candidate, month),
        validDay = mathMin(day, length),
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
  throw new RangeErrorConstructor('Invalid month-day')
}

export function parseShortSlot(
  value: string,
  kind: 'year-month' | 'month-day',
  options?: unknown
): DateSlot {
  const native = nativeTemporal()
  // Undefined options have no observable reads; keep the direct native parser.
  if (
    (import.meta.formatjsTemporalNativeData === true || native) &&
    options === undefined
  )
    return kind === 'year-month'
      ? native!.parsePlainYearMonth(value)
      : native!.parsePlainMonthDay(value)
  // https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plainyearmonth.html#L474-L479
  // https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plainmonthday.html#L302-L307
  // plainyearmonth L474 / plainmonthday L302: parse syntax before touching options.
  const parsed = parseShortDateString(value, kind)
  // plainyearmonth L475 / plainmonthday L303: retain the parsed calendar.
  const calendarLike = parsed.calendar
  // plainyearmonth L476 / plainmonthday L304: default absent calendar to ISO.
  // plainyearmonth L477 / plainmonthday L305: canonicalize before reading options.
  const calendar = constructorCalendar(calendarLike)
  // plainyearmonth L478 / plainmonthday L306: normalize options in overflowOption.
  // plainyearmonth L479 / plainmonthday L307: read overflow before bounds and projection.
  overflowOption(options)
  if (import.meta.formatjsTemporalNativeData === true || native)
    return kind === 'year-month'
      ? native!.parsePlainYearMonth(value)
      : native!.parsePlainMonthDay(value)
  if (
    kind === 'month-day' &&
    calendar !== 'iso8601' &&
    (parsed.year < -271821 || parsed.year > 275760)
  )
    throw new RangeErrorConstructor('Date out of range')
  if (calendar === 'iso8601') {
    // Parsing already validated the ISO fields, including the reference year.
    const year = kind === 'month-day' ? 1972 : parsed.year,
      epochDay = ArithmeticCalendarToEpochDay(
        'iso8601',
        year,
        parsed.month,
        parsed.day
      )
    if (kind === 'year-month') checkYearMonth(epochDay)
    const referenceDay =
      kind === 'month-day'
        ? epochDay
        : checkYearMonth(epochDay - parsed.day + 1)
    return {
      epochDay: referenceDay,
      calendar,
      [isoDateFields]: cachedISODateFields(
        referenceDay,
        year,
        parsed.month,
        kind === 'month-day' ? parsed.day : 1
      ),
    }
  }
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
  const option = calendarNameOption(calendarName),
    native = nativeTemporal()
  if (import.meta.formatjsTemporalNativeData === true || native)
    return kind === 'year-month'
      ? native!.formatPlainYearMonth(slot, option)
      : native!.formatPlainMonthDay(slot, option)
  const annotation =
    option === 'never' || (option === 'auto' && slot.calendar === 'iso8601')
      ? ''
      : `[${option === 'critical' ? '!' : ''}u-ca=${slot.calendar}]`
  const full =
    slot.calendar !== 'iso8601' || option === 'always' || option === 'critical'
  return (
    formatISODate(
      slot.epochDay,
      full ? 'date' : kind,
      slot.calendar === 'iso8601' ? slot[isoDateFields] : undefined
    ) + annotation
  )
}
export function mergeShortFields(
  slot: DateSlot,
  partial: Record<string, unknown>,
  kind: 'year-month' | 'month-day' = 'year-month'
): Record<string, unknown> {
  const fields: Record<string, unknown> = {...dateFields(slot, true)}
  if (kind === 'month-day') fields.year = undefined
  else fields.day = undefined
  return mergeDateFields(slot.calendar, fields, partial)
}
