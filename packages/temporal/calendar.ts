import {
  RangeErrorConstructor,
  TypeErrorConstructor,
  arrayIncludes,
  arrayIndexOf,
  arraySome,
  floor,
  mathAbs,
  mathMax,
  mathMin,
  mathSign,
  mathTrunc,
  numberFrom,
  numberIsInteger,
  numberIsSafeInteger,
} from '#packages/ecma262-abstract/intrinsics.js'
import {nativeTemporal} from '#packages/temporal/native.js'
import {
  isLunisolar,
  tableLeapMonth,
  tableYearStart,
  tableMonthLength,
  tableMonthSerial,
  tableAddMonths,
  tableMonthDifference,
  tableDate,
} from '#packages/temporal/calendar-table.js'

import {
  ArithmeticCalendarStartOfYear,
  ArithmeticCalendarMonthsInYear,
  ArithmeticCalendarDaysInMonth,
  ArithmeticCalendarMonthCode,
  ArithmeticCalendarFromEpochDay,
  ArithmeticGregorianFromEpochDay,
  ArithmeticCalendarToEpochDay,
  ArithmeticCalendarEra,
  HebrewLeapYear as hebrewLeap,
  HebrewElapsedMonths as elapsedMonths,
  JapaneseEras as japaneseEras,
} from '#packages/ecma402-abstract/Calendar/Arithmetic.js'
export {arithmeticCalendars} from '#packages/ecma402-abstract/Calendar/Arithmetic.js'

import {calendarIds, type CalendarId} from '#packages/temporal/calendar-ids.js'
export {calendarIds, type CalendarId} from '#packages/temporal/calendar-ids.js'
export type Overflow = 'constrain' | 'reject'
export interface CalendarFields {
  year: number
  month?: number
  monthCode?: string
  day: number
}
export interface CalendarDate {
  year: number
  month: number
  monthCode: string
  day: number
}
const isoFieldsMemo = new Map<number, Readonly<CalendarDate>>()
const getISOFields = isoFieldsMemo.get.bind(isoFieldsMemo)
const setISOFields = isoFieldsMemo.set.bind(isoFieldsMemo)
const deleteISOFields = isoFieldsMemo.delete.bind(isoFieldsMemo)
const isoFieldsKeys = new Float64Array(64)
let isoFieldsCount = 0
let isoFieldsPosition = 0
let isoFieldsSkip = 0

// Pure ISO metadata; callers validate fields and bounds.
export function cachedISODateFields(epochDay: number): Readonly<CalendarDate>
export function cachedISODateFields(
  epochDay: number,
  year: number,
  month: number,
  day: number
): Readonly<CalendarDate>
// Temporal comparison §12.3.26 step 1.b.
// Reuse the prepared ISO year, month, month code and day.
export function cachedISODateFields(
  epochDay: number,
  year?: number,
  month?: number,
  day?: number
): Readonly<CalendarDate> {
  const remember = isoFieldsSkip === 0
  if (remember) {
    const fields = getISOFields(epochDay)
    if (fields) return fields
    isoFieldsSkip = 32
  } else isoFieldsSkip--
  const fields =
    year === undefined
      ? ArithmeticGregorianFromEpochDay('iso8601', epochDay)
      : {
          year,
          month: month!,
          monthCode: 'M' + (month! < 10 ? '0' : '') + month,
          day: day!,
        }
  if (remember) {
    if (isoFieldsCount === 64) deleteISOFields(isoFieldsKeys[isoFieldsPosition])
    else isoFieldsCount++
    setISOFields(epochDay, fields)
    isoFieldsKeys[isoFieldsPosition] = epochDay
    isoFieldsPosition = (isoFieldsPosition + 1) & 63
  }
  return fields
}

export interface DateDuration {
  years?: number
  months?: number
  weeks?: number
  days?: number
}
// Temporal comparison §9.5.4 step 2.
// Compute a nonnegative month residue for ISO year-month balancing.
const mod = (value: number, divisor: number): number =>
  value - floor(value / divisor) * divisor
function integer(value: number): number {
  // ECMA-262 §21.1.2.5 steps 1.a–2: Check prepared Numbers before calendar arithmetic.
  if (!numberIsSafeInteger(value))
    throw new RangeErrorConstructor('Expected safe integer')
  return value
}
function yearCheck(year: number): number {
  if (mathAbs(integer(year)) > 400000)
    throw new RangeErrorConstructor('Calendar year out of range')
  return year
}
// Temporal comparison §3.5.12 steps 1, 2, §5.5.4 steps 3, 4.
// Check the inclusive epoch-day interval for a date at noon.
export function dayCheck(day: number): number {
  if (integer(day) < -100000001 || day > 100000000)
    throw new RangeErrorConstructor('Calendar date out of range')
  return day
}
function calendarCheck(calendar: CalendarId): void {
  if (!arrayIncludes(calendarIds, calendar))
    throw new RangeErrorConstructor('Unsupported calendar')
}
function overflowCheck(overflow: Overflow): void {
  if (overflow !== 'constrain' && overflow !== 'reject')
    throw new RangeErrorConstructor('Invalid overflow')
}
// Temporal comparison §3.5.7 steps 1.a, 1.c, 2.b.
// Clamp or reject a prepared month or day.
function regulate(
  value: number,
  min: number,
  max: number,
  overflow: Overflow
): number {
  if (!numberIsInteger(value))
    throw new RangeErrorConstructor('Expected finite integer')
  if (overflow === 'reject' && (value < min || value > max))
    throw new RangeErrorConstructor('Calendar field out of range')
  return mathMin(mathMax(value, min), max)
}
// Temporal comparison §3.3.11 step 3, §3.3.16 step 3.
// Look up the first epoch day of the calendar year.
function start(calendar: CalendarId, year: number): number {
  if (isLunisolar(calendar)) return tableYearStart(calendar, year)!
  if (calendar === 'islamic-umalqura')
    return (
      tableYearStart(calendar, year) ??
      ArithmeticCalendarStartOfYear('islamic-civil', year)
    )
  return ArithmeticCalendarStartOfYear(calendar, year)
}
// Temporal comparison §3.3.11 step 3, §3.3.16 step 3.
// Select the provider for the calendar year start.
export function calendarStartOfYear(
  calendar: CalendarId,
  year: number
): number {
  calendarCheck(calendar)
  yearCheck(year)
  const native = nativeTemporal()
  if (import.meta.formatjsTemporalNativeData === true || native)
    return native!.calendarStartOfYear(calendar, year)
  return start(calendar, year)
}
// Temporal comparison §3.3.17 step 3.
// Read the selected calendar's month count for a year.
export function monthsInYear(calendar: CalendarId, year: number): number {
  calendarCheck(calendar)
  yearCheck(year)
  const native = nativeTemporal()
  if (import.meta.formatjsTemporalNativeData === true || native)
    return native!.calendarMonthsInYear(calendar, year)
  if (isLunisolar(calendar)) return tableLeapMonth(calendar, year) ? 13 : 12
  return calendar === 'islamic-umalqura'
    ? 12
    : ArithmeticCalendarMonthsInYear(calendar, year)
}
// Temporal comparison §3.3.15 step 3, §3.5.7 step 1.b.
// Read the prepared calendar month length.
export function daysInMonth(
  calendar: CalendarId,
  year: number,
  month: number
): number {
  const native = nativeTemporal()
  if (import.meta.formatjsTemporalNativeData === true || native)
    return native!.calendarDaysInMonth(calendar, year, month)
  const count = monthsInYear(calendar, year)
  if (integer(month) < 1 || month > count)
    throw new RangeErrorConstructor('Invalid calendar month')
  if (isLunisolar(calendar)) return tableMonthLength(calendar, year, month)!
  if (calendar === 'islamic-umalqura')
    return (
      tableMonthLength(calendar, year, month) ??
      daysInMonth('islamic-civil', year, month)
    )
  return ArithmeticCalendarDaysInMonth(calendar, year, month)
}
// Temporal comparison §12.2.2 steps 2, 3.a, 4, §12.3.26 step 2.
// Encode the month code after projecting its calendar index.
function monthCode(calendar: CalendarId, year: number, month: number): string {
  if (isLunisolar(calendar)) {
    const leap = tableLeapMonth(calendar, year),
      code = month - numberFrom(leap > 0 && month > leap)
    return (
      'M' +
      (code < 10 ? '0' : '') +
      code +
      (leap > 0 && month === leap + 1 ? 'L' : '')
    )
  }
  return ArithmeticCalendarMonthCode(
    calendar === 'islamic-umalqura' ? 'islamic-civil' : calendar,
    year,
    month
  )
}
// Temporal comparison §12.3.22 step 2, §12.3.21 prose.
// Resolve a prepared non-ISO month code for the selected year.
function monthFromCode(
  calendar: CalendarId,
  year: number,
  code: string,
  overflow: Overflow
): number {
  if (isLunisolar(calendar)) {
    const leapCode = code.length === 4 && code[3] === 'L'
    if (code.length !== 3 && !leapCode)
      throw new RangeErrorConstructor('Invalid month code')
    const number = isoMonthFromCode(code[0] + code[1] + code[2]),
      leap = tableLeapMonth(calendar, year)
    if (leapCode && leap !== number && overflow === 'reject')
      throw new RangeErrorConstructor('Leap month absent')
    return (
      number +
      numberFrom(leap > 0 && (number > leap || (number === leap && leapCode)))
    )
  }
  if (calendar === 'hebrew' && code === 'M05L') {
    if (!hebrewLeap(year) && overflow === 'reject')
      throw new RangeErrorConstructor('Leap month absent')
    return 6
  }
  const month =
    code === 'M13' && arrayIncludes(['coptic', 'ethiopic', 'ethioaa'], calendar)
      ? 13
      : isoMonthFromCode(code)
  return (
    month + numberFrom(calendar === 'hebrew' && hebrewLeap(year) && month >= 6)
  )
}
// Temporal comparison §12.3.31 steps 1.h.i, 1.h.ii, 1.h.iii, 1.h.iv.
// Read a prepared ISO month code and reject out-of-range forms.
function isoMonthFromCode(code: string): number {
  if (code.length !== 3 || code[0] !== 'M')
    throw new RangeErrorConstructor('Invalid month code')
  const tens = code[1],
    units = code[2],
    month = (tens === '1' ? 10 : 0) + +units
  if (
    (tens !== '0' && tens !== '1') ||
    units < '0' ||
    units > '9' ||
    month < 1 ||
    month > 12
  )
    throw new RangeErrorConstructor('Invalid month code')
  return month
}

// ISO fields are already prepared; keep native dispatch and range checks.
// Temporal comparison §12.3.12 steps 2, 3, §12.3.31 steps 1.g, 1.h.v.
// Convert prepared ISO fields and check the resulting day bounds.
export function isoDayFromPreparedFields(
  year: number,
  fields: Readonly<Omit<CalendarFields, 'year'>>,
  overflow: Overflow
): number {
  const sourceMonth = fields.month,
    code = fields.monthCode,
    sourceDay = fields.day
  overflowCheck(overflow)
  yearCheck(year)
  const native = nativeTemporal()
  if (import.meta.formatjsTemporalNativeData === true || native) {
    if (sourceMonth === undefined && code === undefined)
      throw new TypeErrorConstructor('Month or monthCode required')
    return dayCheck(
      native!.calendarToEpochDay(
        'iso8601',
        {year, month: sourceMonth, monthCode: code, day: sourceDay},
        overflow
      )
    )
  }
  let month: number
  if (code !== undefined) {
    month = isoMonthFromCode(code)
    if (sourceMonth !== undefined && integer(sourceMonth) !== month)
      throw new RangeErrorConstructor('Month and monthCode disagree')
  } else {
    if (sourceMonth === undefined)
      throw new TypeErrorConstructor('Month or monthCode required')
    month = regulate(sourceMonth, 1, 12, overflow)
  }
  const day = regulate(
    sourceDay,
    1,
    ArithmeticCalendarDaysInMonth('iso8601', year, month),
    overflow
  )
  return dayCheck(ArithmeticCalendarToEpochDay('iso8601', year, month, day))
}

// Temporal comparison §12.3.22 steps 1.b, 2.
// Convert prepared calendar fields to an epoch day.
export function calendarToEpochDayRaw(
  calendar: CalendarId,
  fields: CalendarFields,
  overflow: Overflow = 'constrain'
): number {
  calendarCheck(calendar)
  overflowCheck(overflow)
  const year = yearCheck(fields.year)
  const native = nativeTemporal()
  if (import.meta.formatjsTemporalNativeData === true || native) {
    if (fields.month === undefined && fields.monthCode === undefined)
      throw new TypeErrorConstructor('Month or monthCode required')
    return native!.calendarToEpochDay(calendar, fields, overflow)
  }
  let month: number
  if (fields.monthCode !== undefined) {
    month =
      calendar === 'iso8601'
        ? isoMonthFromCode(fields.monthCode)
        : monthFromCode(calendar, year, fields.monthCode, overflow)
    if (fields.month !== undefined && integer(fields.month) !== month)
      throw new RangeErrorConstructor('Month and monthCode disagree')
  } else {
    if (fields.month === undefined)
      throw new TypeErrorConstructor('Month or monthCode required')
    month = regulate(
      fields.month,
      1,
      calendar === 'iso8601' ? 12 : monthsInYear(calendar, year),
      overflow
    )
  }
  const day = regulate(
    fields.day,
    1,
    calendar === 'iso8601'
      ? ArithmeticCalendarDaysInMonth('iso8601', year, month)
      : daysInMonth(calendar, year, month),
    overflow
  )
  if (!isLunisolar(calendar) && calendar !== 'islamic-umalqura')
    return integer(ArithmeticCalendarToEpochDay(calendar, year, month, day))
  let epoch = start(calendar, year) + day - 1
  for (let m = 1; m < month; m++) epoch += daysInMonth(calendar, year, m)
  return integer(epoch)
}
// Temporal comparison §12.3.12 steps 2, 3.
// Apply the normal date bounds after calendar conversion.
export function calendarToEpochDay(
  calendar: CalendarId,
  fields: CalendarFields,
  overflow: Overflow = 'constrain'
): number {
  return dayCheck(calendarToEpochDayRaw(calendar, fields, overflow))
}
// Temporal comparison §12.3.26 steps 1.b, 2.
// Project a bounded epoch day into calendar date fields.
export function calendarFromEpochDay(
  calendar: CalendarId,
  epoch: number
): CalendarDate {
  return calendarFromEpochDayRaw(calendar, dayCheck(epoch))
}
// Temporal comparison §12.3.26 steps 1.b, 2, §12.3.25 prose.
// Project an epoch day using native, arithmetic or table chronology.
export function calendarFromEpochDayRaw(
  calendar: CalendarId,
  epoch: number
): CalendarDate {
  calendarCheck(calendar)
  if (mathAbs(integer(epoch)) > 110000000)
    throw new RangeErrorConstructor('Calendar date out of range')
  const native = nativeTemporal()
  if (import.meta.formatjsTemporalNativeData === true || native)
    return native!.calendarFromEpochDay(calendar, epoch)
  if (isLunisolar(calendar)) {
    const value = tableDate(calendar, epoch)
    return {...value, monthCode: monthCode(calendar, value.year, value.month)}
  }
  if (calendar !== 'islamic-umalqura')
    return ArithmeticCalendarFromEpochDay(calendar, epoch)
  const jd = epoch + 2440588
  let year = floor((30 * (jd - 1948440) + 10646) / 10631)
  while (start(calendar, year) > epoch) year--
  while (start(calendar, year + 1) <= epoch) year++
  let month = 1,
    remaining = epoch - start(calendar, year)
  while (remaining >= daysInMonth(calendar, year, month))
    remaining -= daysInMonth(calendar, year, month++)
  return {
    year,
    month,
    monthCode: monthCode(calendar, year, month),
    day: remaining + 1,
  }
}
// Temporal comparison §9.5.4 steps 1, 2, §12.3.7 step 2.a.
// Balance the prepared ISO or non-ISO year and month.
function addYearMonth(
  calendar: CalendarId,
  original: Readonly<CalendarDate>,
  years: number,
  months: number,
  overflow: Overflow
): {year: number; month: number} {
  let year = yearCheck(original.year + years)
  let month: number
  if (isLunisolar(calendar)) {
    month = monthFromCode(calendar, year, original.monthCode, overflow)
    return tableAddMonths(calendar, year, month, months)
  }
  if (calendar !== 'hebrew') {
    const count = monthsInYear(calendar, year)
    const serial = year * count + original.month - 1 + months
    year = yearCheck(floor(serial / count))
    month = mod(serial, count) + 1
  } else {
    month = monthFromCode(calendar, year, original.monthCode, overflow)
    const serial = integer(elapsedMonths(year) + month - 1 + months)
    year = yearCheck(floor((19 * serial + 234) / 235))
    while (elapsedMonths(year) > serial) year--
    while (elapsedMonths(year + 1) <= serial) year++
    month = serial - elapsedMonths(year) + 1
  }
  return {year, month}
}
// Temporal comparison §12.3.7 steps 1.a, 1.b, 1.d, 2.a.
// Add a date duration through native or fallback chronology.
export function addCalendarDateRaw(
  calendar: CalendarId,
  fields: CalendarFields,
  duration: DateDuration,
  overflow: Overflow = 'constrain'
): CalendarDate {
  overflowCheck(overflow)
  const native = nativeTemporal()
  if (import.meta.formatjsTemporalNativeData === true || native)
    return native!.calendarAdd(calendar, fields, duration, overflow)
  const original = calendarFromEpochDayRaw(
    calendar,
    calendarToEpochDayRaw(calendar, fields, 'reject')
  )
  return calendarFromEpochDayRaw(
    calendar,
    addCalendarEpochDay(calendar, original, duration, overflow)
  )
}
// Temporal comparison §12.3.7 steps 1.a, 1.b, 1.c, 1.d, 2.a.
// Balance year and month, regulate the day and add weeks and days.
function addCalendarEpochDay(
  calendar: CalendarId,
  original: Readonly<CalendarDate>,
  duration: DateDuration,
  overflow: Overflow
): number {
  const values = [
    duration.years ?? 0,
    duration.months ?? 0,
    duration.weeks ?? 0,
    duration.days ?? 0,
  ]
  for (let index = 0; index < values.length; index++)
    values[index] = integer(values[index])
  // Temporal comparison §7.5.9 step 1. Reject mixed signs.
  if (
    arraySome(
      values,
      // Temporal comparison §7.5.16 step 2.b. Find a negative field.
      x => x < 0
    ) &&
    arraySome(
      values,
      // Temporal comparison §7.5.16 step 2.c. Find a positive field.
      x => x > 0
    )
  )
    throw new RangeErrorConstructor('Mixed duration signs')
  const {year, month} = addYearMonth(
    calendar,
    original,
    values[0],
    values[1],
    overflow
  )
  // Temporal comparison §3.5.6 step 10. Shared ISO day regulation in constrain mode.
  const epoch = calendarToEpochDayRaw(
    calendar,
    {year, month, monthCode: undefined, day: original.day},
    overflow
  )
  // Temporal comparison §3.5.6 step 11. An ISO week has seven days.
  return epoch + integer(7 * values[2] + values[3])
}
// Fields must come from this calendar's epoch-day conversion.
// Temporal comparison §12.3.7 steps 1.a, 1.b, 1.d, 2.a.
// Carry normalized calendar arithmetic back as an epoch day and fields.
export function addNormalizedCalendarDate(
  calendar: CalendarId,
  original: Readonly<CalendarDate>,
  duration: DateDuration,
  overflow: Overflow
): {epochDay: number; date: CalendarDate} {
  overflowCheck(overflow)
  const native = nativeTemporal()
  if (import.meta.formatjsTemporalNativeData === true || native) {
    const date = native!.calendarAdd(calendar, original, duration, overflow)
    return {epochDay: calendarToEpochDayRaw(calendar, date, 'reject'), date}
  }
  const epochDay = addCalendarEpochDay(calendar, original, duration, overflow)
  return {epochDay, date: calendarFromEpochDayRaw(calendar, epochDay)}
}
// Temporal comparison §12.3.7 steps 3, 4.
// Bound the calendar addition result before returning its fields.
export function addCalendarDate(
  calendar: CalendarId,
  fields: CalendarFields,
  duration: DateDuration,
  overflow: Overflow = 'constrain'
): CalendarDate {
  const result = addCalendarDateRaw(calendar, fields, duration, overflow)
  dayCheck(calendarToEpochDayRaw(calendar, result, 'reject'))
  return result
}
export function calendarDaysUntil(
  calendar: CalendarId,
  one: CalendarFields,
  two: CalendarFields
): number {
  return (
    calendarToEpochDay(calendar, two, 'reject') -
    calendarToEpochDay(calendar, one, 'reject')
  )
}

// Temporal comparison §12.3.9 steps 3.e.ii, 4, §12.3.8 prose.
// Provide serial month indices for calendar difference.
export function calendarMonthSerial(
  calendar: CalendarId,
  year: number,
  month: number
): number {
  calendarCheck(calendar)
  const native = nativeTemporal()
  if (import.meta.formatjsTemporalNativeData === true || native)
    return native!.calendarMonthSerial(calendar, year, month)
  if (isLunisolar(calendar)) return tableMonthSerial(calendar, year, month)
  return calendar === 'hebrew'
    ? elapsedMonths(year) + month - 1
    : year * monthsInYear(calendar, year) + month - 1
}
// Temporal comparison §12.3.9 steps 2, 3.k, 4.
// Compute the date duration for the prepared endpoints and largest unit.
export function calendarDateUntilRaw(
  calendar: CalendarId,
  one: number,
  two: number,
  largest: string
): DateDuration {
  const native = nativeTemporal()
  if (import.meta.formatjsTemporalNativeData === true || native)
    return native!.calendarUntil(calendar, one, two, largest)
  const first = calendarFromEpochDayRaw(calendar, one),
    last = calendarFromEpochDayRaw(calendar, two)
  const result = {years: 0, months: 0, weeks: 0, days: 0},
    sign = mathSign(two - one)
  if (!sign) return result
  // Difference prefixes compare unregulated days and month codes, not clamped dates.
  // Temporal comparison §3.5.6 steps 4, 7, 8, §12.3.9 steps 3.c.ii, 3.e.ii.
  // Compare the candidate prefix with the endpoint before day clamping.
  const surpasses = (): boolean => {
    const year = first.year + result.years
    const codeOrder =
      first.monthCode === last.monthCode
        ? 0
        : first.monthCode > last.monthCode
          ? 1
          : -1
    if (sign * (year - last.year || codeOrder || first.day - last.day) > 0)
      return true
    const candidate = addYearMonth(
      calendar,
      first,
      result.years,
      result.months,
      'constrain'
    )
    // Temporal comparison §3.5.6 step 9. A false ISO prefix comparison ends the zero week/day case.
    // https://tc39.es/proposal-temporal/#sec-temporal-isodatesurpasses
    return (
      sign *
        (candidate.year - last.year ||
          candidate.month - last.month ||
          first.day - last.day) >
      0
    )
  }
  let anchor = one
  if (largest === 'year') {
    result.years = last.year - first.year
    if (surpasses()) result.years -= sign
  }
  if (largest === 'year' || largest === 'month') {
    const base = addYearMonth(calendar, first, result.years, 0, 'constrain')
    result.months = isLunisolar(calendar)
      ? tableMonthDifference(
          calendar,
          base.year,
          base.month,
          last.year,
          last.month
        )
      : calendarMonthSerial(calendar, last.year, last.month) -
        calendarMonthSerial(calendar, base.year, base.month)
    if (surpasses()) result.months -= sign
    anchor = calendarToEpochDayRaw(
      calendar,
      addCalendarDateRaw(calendar, first, result, 'constrain'),
      'reject'
    )
  }
  // ECMA-262 preview §22.3.3.3 steps 3.g and 3.j count whole weeks and days
  // up to the target. Subtract epoch days to compute that residual directly.
  // https://tc39.es/ecma262/pr/3966/#sec-calendardateuntil
  // §22.3.8.2 step 5 corrects the zero-month guard for these searches.
  // https://tc39.es/ecma262/pr/3966/#sec-isodatesurpasses
  // https://github.com/tc39/proposal-temporal/issues/3340
  result.days = two - anchor
  if (largest === 'week') {
    result.weeks = mathTrunc(result.days / 7) || 0
    result.days = result.days % 7 || 0
  }
  return result
}
// Temporal comparison §3.3.4 step 3, §3.3.5 step 3.
// Project era and era year from the private calendar date.
export function calendarEra(
  calendar: CalendarId,
  epoch: number,
  extended = false
): {era: string; eraYear: number} | undefined {
  const native = nativeTemporal()
  if (import.meta.formatjsTemporalNativeData === true || native) {
    if (!extended) dayCheck(epoch)
    return native!.calendarEra(calendar, epoch)
  }
  const {year} = (extended ? calendarFromEpochDayRaw : calendarFromEpochDay)(
    calendar,
    epoch
  )
  if (calendar === 'chinese' || calendar === 'dangi') return undefined
  return ArithmeticCalendarEra(
    calendar === 'islamic-umalqura' ? 'islamic-civil' : calendar,
    epoch,
    year
  )
}
export function calendarYearFromEra(
  calendar: CalendarId,
  era: string,
  eraYear: number
): number {
  calendarCheck(calendar)
  integer(eraYear)
  const native = nativeTemporal()
  if (import.meta.formatjsTemporalNativeData === true || native)
    return native!.calendarYearFromEra(calendar, era, eraYear)
  // Temporal comparison §12.3.31 step2.a / §12.3.30: normalize private era data.
  // https://tc39.es/proposal-temporal/#sec-temporal-nonisoresolvefields
  if (calendar === 'japanese')
    for (let index = 0; index < japaneseEras.length; index++) {
      const entry = japaneseEras[index]
      if (era === entry[1]) return yearCheck(eraYear + entry[2])
    }
  if (calendar === 'ethiopic' && era === 'aa') return yearCheck(eraYear - 5500)
  const names: Partial<Record<CalendarId, readonly string[]>> = {
    gregory: ['ce', 'bce'],
    japanese: ['ce', 'bce'],
    buddhist: ['be'],
    coptic: ['am'],
    ethiopic: ['am'],
    ethioaa: ['aa'],
    hebrew: ['am'],
    indian: ['shaka'],
    persian: ['ap'],
    roc: ['roc', 'broc'],
    'islamic-umalqura': ['ah', 'bh'],
    'islamic-civil': ['ah', 'bh'],
    'islamic-tbla': ['ah', 'bh'],
  }
  if (
    (calendar === 'gregory' || calendar === 'japanese') &&
    (era === 'ad' || era === 'bc')
  )
    era = era === 'ad' ? 'ce' : 'bce'
  const eras = names[calendar],
    index = eras ? arrayIndexOf(eras, era) : -1
  if (index < 0) throw new RangeErrorConstructor('Invalid era')
  return yearCheck(index === 1 ? 1 - eraYear : eraYear)
}
