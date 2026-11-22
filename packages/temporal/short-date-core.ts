import {
  RangeErrorConstructor,
  TypeErrorConstructor,
  arrayIncludes,
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
  dayCheck,
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
  // Proposal comparison §13.1 steps 3–4: Convert a validated ISO reference date
  // to its epoch day.
  return calendarToEpochDayRaw('iso8601', {year, month, day}, 'reject')
}
// Temporal comparison §9.5.3 steps1–4: guard inclusive ISO year-month limits
// https://tc39.es/proposal-temporal/#sec-temporal-isoyearmonthwithinlimits
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

// Temporal comparison §12.3.13 steps1–5: use day1, resolve fields and guard the reference date
// https://tc39.es/proposal-temporal/#sec-temporal-calendaryearmonthfromfields
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
// Temporal comparison §12.3.14 steps1–4: resolve fields before reference-year canonicalization
// https://tc39.es/proposal-temporal/#sec-temporal-calendarmonthdayfromfields
export function monthDayFields(
  calendar: string,
  fields: Record<string, unknown>,
  overflow: Overflow
): DateSlot {
  const cal = shortCalendar(calendar)
  let year = resolveCalendarYear(calendar, fields, 'month-day')
  let day = fields.day as number,
    code = fields.monthCode as string | undefined
  // Comparison §12.3.24 steps1.a–1.e: supplied-year regulation, then1972.
  // https://tc39.es/proposal-temporal/#sec-temporal-calendarmonthdaytoisoreferencedate
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
  // Temporal comparison §10.5.1 steps2.f/15: private month-code normalization.
  const lunisolar = calendar === 'chinese' || calendar === 'dangi'
  if (lunisolar) {
    if (day > 30 && overflow === 'reject')
      throw new RangeErrorConstructor('Day out of range')
    day = mathMin(day, 30)
    if (
      code![code!.length - 1] === 'L' &&
      (code === 'M01L' ||
        code === 'M12L' ||
        (day === 30 &&
          arrayIncludes(['M02L', 'M08L', 'M09L', 'M10L', 'M11L'], code!)))
    ) {
      if (overflow === 'reject')
        throw new RangeErrorConstructor('Invalid month-day')
      code = code![0] + code![1] + code![2]
    }
  }
  // Comparison §12.3.23 reference-date rule: latest1900–1972, else earliest1973–2035.
  // https://tc39.es/proposal-temporal/#sec-temporal-nonisomonthdaytoisoreferencedate
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

// Temporal comparison §9.5.2 steps4–15: parse YearMonth before options, bounds and canonicalization
// https://tc39.es/proposal-temporal/#sec-temporal-totemporalyearmonth
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
  // Comparison §9.5.2 steps4–9 and §10.5.1 steps4–9.
  // https://tc39.es/proposal-temporal/#sec-temporal-totemporalmonthday
  // Both step4: parse syntax before touching options.
  const parsed = parseShortDateString(value, kind)
  // Both step5: retain the parsed calendar.
  const calendarLike = parsed.calendar
  // Both step6: default absent calendar to ISO.
  // Both step7: canonicalize before reading options.
  const calendar = constructorCalendar(calendarLike)
  // Both step8: normalize options in overflowOption.
  // Both step9: read overflow before bounds and projection.
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
  // Temporal comparison §10.5.1 step12: validate the original non-ISO date.
  if (kind === 'year-month') checkYearMonth(epochDay)
  else dayCheck(epochDay)
  // Temporal comparison §10.5.1 step15: calendar preparation uses private fields.
  const fields = {__proto__: null, ...dateFields({epochDay, calendar}, true)}
  return kind === 'year-month'
    ? yearMonthFields(calendar, fields, 'constrain')
    : monthDayFields(calendar, fields, 'constrain')
}
// Temporal comparison §9.5.6 steps1–7: format YearMonth reference fields and calendar annotation
// https://tc39.es/proposal-temporal/#sec-temporal-temporalyearmonthtostring
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
  // Comparison §10.5.3 steps1–7 applies to the MonthDay branch.
  // https://tc39.es/proposal-temporal/#sec-temporal-temporalmonthdaytostring
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
  // Proposal comparison §9.3.13 steps 5 and 7 and §10.3.6 steps 5 and 7:
  // ECMA-262 preview §22.3.9.4 steps 3–5: retain monthCode and the year or day.
  // https://tc39.es/ecma262/pr/3966/#sec-isodatetofields
  const fields: Record<string, unknown> = {...dateFields(slot, true)}
  if (kind === 'month-day') fields.year = undefined
  else fields.day = undefined
  return mergeDateFields(slot.calendar, fields, partial)
}
