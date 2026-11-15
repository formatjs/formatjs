// Numeric calendar experiment; caller owns Temporal coercion and property order.
import {
  DateFromTime,
  DayFromYear,
  DaysInYear,
  MonthFromTime,
  YearFromTime,
} from '#packages/ecma262-abstract/DateOperations.js'

export type CalendarId = 'iso8601' | 'hebrew'
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
export interface DateDuration {
  years?: number
  months?: number
  weeks?: number
  days?: number
}
const monthStarts = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334]
const mod = (value: number, divisor: number): number =>
  value - Math.floor(value / divisor) * divisor
function integer(value: number): number {
  if (!Number.isSafeInteger(value))
    throw new RangeError('Expected safe integer')
  return value
}
function yearCheck(year: number): number {
  if (Math.abs(integer(year)) > 300000)
    throw new RangeError('Calendar year out of range')
  return year
}
function dayCheck(day: number): number {
  if (integer(day) < -100000001 || day > 100000000)
    throw new RangeError('Calendar date out of range')
  return day
}
function calendarCheck(calendar: CalendarId): void {
  if (calendar !== 'iso8601' && calendar !== 'hebrew')
    throw new RangeError('Unsupported calendar')
}
function overflowCheck(overflow: Overflow): void {
  if (overflow !== 'constrain' && overflow !== 'reject')
    throw new RangeError('Invalid overflow')
}
function regulate(
  value: number,
  min: number,
  max: number,
  overflow: Overflow
): number {
  integer(value)
  if (overflow === 'reject' && (value < min || value > max))
    throw new RangeError('Calendar field out of range')
  return Math.min(Math.max(value, min), max)
}
function hebrewLeap(year: number): boolean {
  return mod(7 * year + 1, 19) < 7
}
function elapsedMonths(year: number): number {
  return Math.floor((235 * year - 234) / 19)
}
// Same postponement arithmetic as crates/intl_datetimeformat_calendars/arithmetic.rs.
function hebrewDelay(year: number): number {
  const months = elapsedMonths(year)
  const day = 29 * months + Math.floor((12084 + 13753 * months) / 25920)
  return day + Number(mod(3 * (day + 1), 7) < 3)
}
function start(calendar: CalendarId, year: number): number {
  if (calendar === 'iso8601') return DayFromYear(year)
  const present = hebrewDelay(year)
  return (
    -2092590 +
    present +
    (hebrewDelay(year + 1) - present === 356
      ? 2
      : present - hebrewDelay(year - 1) === 382
        ? 1
        : 0)
  )
}
export function monthsInYear(calendar: CalendarId, year: number): number {
  calendarCheck(calendar)
  yearCheck(year)
  return calendar === 'hebrew' && hebrewLeap(year) ? 13 : 12
}
export function daysInMonth(
  calendar: CalendarId,
  year: number,
  month: number
): number {
  const count = monthsInYear(calendar, year)
  if (integer(month) < 1 || month > count)
    throw new RangeError('Invalid calendar month')
  if (calendar === 'iso8601') {
    return month === 12
      ? 31
      : monthStarts[month] -
          monthStarts[month - 1] +
          Number(month === 2 && DaysInYear(year) === 366)
  }
  const code = month + Number(!hebrewLeap(year) && month >= 6)
  if ([4, 7, 9, 11, 13].includes(code)) return 29
  const length = start(calendar, year + 1) - start(calendar, year)
  if (code === 2) return length % 10 === 5 ? 30 : 29
  if (code === 3) return length % 10 === 3 ? 29 : 30
  return 30
}
function monthCode(calendar: CalendarId, year: number, month: number): string {
  const leap = calendar === 'hebrew' && hebrewLeap(year)
  if (leap && month === 6) return 'M05L'
  return 'M' + String(month - Number(leap && month > 6)).padStart(2, '0')
}
function monthFromCode(
  calendar: CalendarId,
  year: number,
  code: string,
  overflow: Overflow
): number {
  if (calendar === 'hebrew' && code === 'M05L') {
    if (!hebrewLeap(year) && overflow === 'reject')
      throw new RangeError('Leap month absent')
    return 6
  }
  if (!/^M(0[1-9]|1[0-2])$/.test(code))
    throw new RangeError('Invalid month code')
  const month = Number(code.slice(1))
  return month + Number(calendar === 'hebrew' && hebrewLeap(year) && month >= 6)
}
export function calendarToEpochDay(
  calendar: CalendarId,
  fields: CalendarFields,
  overflow: Overflow = 'constrain'
): number {
  calendarCheck(calendar)
  overflowCheck(overflow)
  const year = yearCheck(fields.year)
  let month: number
  if (fields.monthCode !== undefined) {
    month = monthFromCode(calendar, year, fields.monthCode, overflow)
    if (fields.month !== undefined && integer(fields.month) !== month)
      throw new RangeError('Month and monthCode disagree')
  } else {
    if (fields.month === undefined)
      throw new TypeError('Month or monthCode required')
    month = regulate(fields.month, 1, monthsInYear(calendar, year), overflow)
  }
  const day = regulate(
    fields.day,
    1,
    daysInMonth(calendar, year, month),
    overflow
  )
  let epoch = start(calendar, year) + day - 1
  for (let m = 1; m < month; m++) epoch += daysInMonth(calendar, year, m)
  return dayCheck(epoch)
}
export function calendarFromEpochDay(
  calendar: CalendarId,
  epoch: number
): CalendarDate {
  calendarCheck(calendar)
  dayCheck(epoch)
  if (calendar === 'iso8601') {
    const t = epoch * 86400000
    const year = YearFromTime(t),
      month = MonthFromTime(t) + 1
    return {
      year,
      month,
      monthCode: monthCode(calendar, year, month),
      day: DateFromTime(t),
    }
  }
  let year = Math.floor(epoch / 365.24682220597794) + 5730
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
export function addCalendarDate(
  calendar: CalendarId,
  fields: CalendarFields,
  duration: DateDuration,
  overflow: Overflow = 'constrain'
): CalendarDate {
  overflowCheck(overflow)
  const original = calendarFromEpochDay(
    calendar,
    calendarToEpochDay(calendar, fields, 'reject')
  )
  const values = [
    duration.years ?? 0,
    duration.months ?? 0,
    duration.weeks ?? 0,
    duration.days ?? 0,
  ].map(integer)
  if (values.some(x => x < 0) && values.some(x => x > 0))
    throw new RangeError('Mixed duration signs')
  let year = yearCheck(original.year + values[0])
  let month: number
  if (calendar === 'iso8601') {
    const serial = year * 12 + original.month - 1 + values[1]
    year = yearCheck(Math.floor(serial / 12))
    month = mod(serial, 12) + 1
  } else {
    month = monthFromCode(calendar, year, original.monthCode, overflow)
    const serial = integer(elapsedMonths(year) + month - 1 + values[1])
    year = yearCheck(Math.floor((19 * serial + 234) / 235))
    while (elapsedMonths(year) > serial) year--
    while (elapsedMonths(year + 1) <= serial) year++
    month = serial - elapsedMonths(year) + 1
  }
  const epoch = calendarToEpochDay(
    calendar,
    {year, month, day: original.day},
    overflow
  )
  return calendarFromEpochDay(
    calendar,
    dayCheck(epoch + integer(7 * values[2] + values[3]))
  )
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
