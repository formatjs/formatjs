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
// Numeric calendars; callers own Temporal coercion and property order.
import {
  DateFromTime,
  DayFromYear,
  DaysInYear,
  MonthFromTime,
  YearFromTime,
} from '#packages/ecma262-abstract/DateOperations.js'

export const arithmeticCalendars = [
  'iso8601',
  'gregory',
  'buddhist',
  'japanese',
  'roc',
  'coptic',
  'ethiopic',
  'ethioaa',
  'hebrew',
  'indian',
  'islamic-civil',
  'islamic-tbla',
  'persian',
] as const
export const calendarIds: readonly (
  | (typeof arithmeticCalendars)[number]
  | 'chinese'
  | 'dangi'
  | 'islamic-umalqura'
)[] = [...arithmeticCalendars, 'chinese', 'dangi', 'islamic-umalqura']
export type CalendarId = (typeof calendarIds)[number]
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
  if (Math.abs(integer(year)) > 400000)
    throw new RangeError('Calendar year out of range')
  return year
}
export function dayCheck(day: number): number {
  if (integer(day) < -100000001 || day > 100000000)
    throw new RangeError('Calendar date out of range')
  return day
}
function calendarCheck(calendar: CalendarId): void {
  if (!calendarIds.includes(calendar))
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
  if (!Number.isInteger(value)) throw new RangeError('Expected finite integer')
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
// Same postponement arithmetic as crates/intl_datetimeformat_calendars/core.rs.
function hebrewDelay(year: number): number {
  const months = elapsedMonths(year)
  const day = 29 * months + Math.floor((12084 + 13753 * months) / 25920)
  return day + Number(mod(3 * (day + 1), 7) < 3)
}
function isoLike(calendar: CalendarId): boolean {
  return ['iso8601', 'gregory', 'buddhist', 'japanese', 'roc'].includes(
    calendar
  )
}
function isoYear(calendar: CalendarId, year: number): number {
  return year + (calendar === 'buddhist' ? -543 : calendar === 'roc' ? 1911 : 0)
}
function start(calendar: CalendarId, year: number): number {
  if (isLunisolar(calendar)) return tableYearStart(calendar, year)!
  if (calendar === 'islamic-umalqura')
    return tableYearStart(calendar, year) ?? start('islamic-civil', year)
  if (isoLike(calendar)) return DayFromYear(isoYear(calendar, year))
  switch (calendar) {
    case 'coptic':
      return 1824665 - 2440588 + 365 * year + Math.floor(year / 4)
    case 'ethiopic':
      return 1723856 - 2440588 + 365 * year + Math.floor(year / 4)
    case 'ethioaa': {
      const value = year - 5500
      return 1723856 - 2440588 + 365 * value + Math.floor(value / 4)
    }
    case 'indian': {
      const value = year + 78
      return DayFromYear(value) + 80
    }
    case 'islamic-civil':
    case 'islamic-tbla':
      return (
        1948440 -
        2440588 -
        Number(calendar === 'islamic-tbla') +
        354 * (year - 1) +
        Math.floor((3 + 11 * year) / 30)
      )
    case 'persian':
      return (
        1948320 - 2440588 + 365 * (year - 1) + Math.floor((8 * year + 21) / 33)
      )
  }
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
export function calendarStartOfYear(
  calendar: CalendarId,
  year: number
): number {
  calendarCheck(calendar)
  yearCheck(year)
  const native = nativeTemporal()
  if (native) return native.calendarStartOfYear(calendar, year)
  return start(calendar, year)
}
export function monthsInYear(calendar: CalendarId, year: number): number {
  calendarCheck(calendar)
  yearCheck(year)
  const native = nativeTemporal()
  if (native) return native.calendarMonthsInYear(calendar, year)
  if (isLunisolar(calendar)) return tableLeapMonth(calendar, year) ? 13 : 12
  return ['coptic', 'ethiopic', 'ethioaa'].includes(calendar) ||
    (calendar === 'hebrew' && hebrewLeap(year))
    ? 13
    : 12
}
export function daysInMonth(
  calendar: CalendarId,
  year: number,
  month: number
): number {
  const native = nativeTemporal()
  if (native) return native.calendarDaysInMonth(calendar, year, month)
  const count = monthsInYear(calendar, year)
  if (integer(month) < 1 || month > count)
    throw new RangeError('Invalid calendar month')
  if (isLunisolar(calendar)) return tableMonthLength(calendar, year, month)!
  if (calendar === 'islamic-umalqura')
    return (
      tableMonthLength(calendar, year, month) ??
      daysInMonth('islamic-civil', year, month)
    )
  if (isoLike(calendar)) {
    return month === 12
      ? 31
      : monthStarts[month] -
          monthStarts[month - 1] +
          Number(month === 2 && DaysInYear(isoYear(calendar, year)) === 366)
  }
  const length = start(calendar, year + 1) - start(calendar, year)
  if (['coptic', 'ethiopic', 'ethioaa'].includes(calendar))
    return month === 13 ? length - 360 : 30
  if (calendar === 'indian')
    return month === 1
      ? 30 + Number(DaysInYear(year + 78) === 366)
      : month <= 6
        ? 31
        : 30
  if (calendar === 'islamic-civil' || calendar === 'islamic-tbla')
    return month % 2 === 1 || (month === 12 && length === 355) ? 30 : 29
  if (calendar === 'persian')
    return month <= 6 ? 31 : month < 12 ? 30 : length - 336
  const code = month + Number(!hebrewLeap(year) && month >= 6)
  if ([4, 7, 9, 11, 13].includes(code)) return 29
  if (code === 2) return length % 10 === 5 ? 30 : 29
  if (code === 3) return length % 10 === 3 ? 29 : 30
  return 30
}
function monthCode(calendar: CalendarId, year: number, month: number): string {
  if (isLunisolar(calendar)) {
    const leap = tableLeapMonth(calendar, year)
    return (
      'M' +
      String(month - Number(leap > 0 && month > leap)).padStart(2, '0') +
      (leap > 0 && month === leap + 1 ? 'L' : '')
    )
  }
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
  if (isLunisolar(calendar)) {
    if (!/^M(0[1-9]|1[0-2])L?$/.test(code))
      throw new RangeError('Invalid month code')
    const number = Number(code.slice(1, 3)),
      leap = tableLeapMonth(calendar, year)
    if (code.endsWith('L') && leap !== number && overflow === 'reject')
      throw new RangeError('Leap month absent')
    return (
      number +
      Number(
        leap > 0 && (number > leap || (number === leap && code.endsWith('L')))
      )
    )
  }
  if (calendar === 'hebrew' && code === 'M05L') {
    if (!hebrewLeap(year) && overflow === 'reject')
      throw new RangeError('Leap month absent')
    return 6
  }
  if (
    !/^M(0[1-9]|1[0-3])$/.test(code) ||
    (code === 'M13' && !['coptic', 'ethiopic', 'ethioaa'].includes(calendar))
  )
    throw new RangeError('Invalid month code')
  const month = Number(code.slice(1))
  return month + Number(calendar === 'hebrew' && hebrewLeap(year) && month >= 6)
}
export function calendarToEpochDayRaw(
  calendar: CalendarId,
  fields: CalendarFields,
  overflow: Overflow = 'constrain'
): number {
  calendarCheck(calendar)
  overflowCheck(overflow)
  const year = yearCheck(fields.year)
  const native = nativeTemporal()
  if (native) {
    if (fields.month === undefined && fields.monthCode === undefined)
      throw new TypeError('Month or monthCode required')
    return native.calendarToEpochDay(calendar, fields, overflow)
  }
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
  return integer(epoch)
}
export function calendarToEpochDay(
  calendar: CalendarId,
  fields: CalendarFields,
  overflow: Overflow = 'constrain'
): number {
  return dayCheck(calendarToEpochDayRaw(calendar, fields, overflow))
}
export function calendarFromEpochDay(
  calendar: CalendarId,
  epoch: number
): CalendarDate {
  return calendarFromEpochDayRaw(calendar, dayCheck(epoch))
}
export function calendarFromEpochDayRaw(
  calendar: CalendarId,
  epoch: number
): CalendarDate {
  calendarCheck(calendar)
  if (Math.abs(integer(epoch)) > 110000000)
    throw new RangeError('Calendar date out of range')
  const native = nativeTemporal()
  if (native) return native.calendarFromEpochDay(calendar, epoch)
  if (isLunisolar(calendar)) {
    const value = tableDate(calendar, epoch)
    return {...value, monthCode: monthCode(calendar, value.year, value.month)}
  }
  const t = epoch * 86400000,
    civilYear = YearFromTime(t)
  if (isoLike(calendar)) {
    const year =
        civilYear -
        (calendar === 'buddhist' ? -543 : calendar === 'roc' ? 1911 : 0),
      month = MonthFromTime(t) + 1
    return {
      year,
      month,
      monthCode: monthCode(calendar, year, month),
      day: DateFromTime(t),
    }
  }
  const jd = epoch + 2440588
  let year: number
  switch (calendar) {
    case 'coptic':
      year = Math.floor((4 * (jd - 1824665) + 3) / 1461)
      break
    case 'ethiopic':
    case 'ethioaa':
      year =
        Math.floor((4 * (jd - 1723856) + 3) / 1461) +
        (calendar === 'ethioaa' ? 5500 : 0)
      break
    case 'islamic-umalqura':
    case 'islamic-civil':
    case 'islamic-tbla':
      year = Math.floor(
        (30 * (jd - 1948440 + Number(calendar === 'islamic-tbla')) + 10646) /
          10631
      )
      break
    case 'persian':
      year = 1 + Math.floor((33 * (jd - 1948320) + 3) / 12053)
      break
    case 'indian':
      year = civilYear - 78
      break
    default:
      year = Math.floor(((epoch + 2092590) * 492480) / 179876755) + 1
  }
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
function addYearMonth(
  calendar: CalendarId,
  original: CalendarDate,
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
    year = yearCheck(Math.floor(serial / count))
    month = mod(serial, count) + 1
  } else {
    month = monthFromCode(calendar, year, original.monthCode, overflow)
    const serial = integer(elapsedMonths(year) + month - 1 + months)
    year = yearCheck(Math.floor((19 * serial + 234) / 235))
    while (elapsedMonths(year) > serial) year--
    while (elapsedMonths(year + 1) <= serial) year++
    month = serial - elapsedMonths(year) + 1
  }
  return {year, month}
}
export function addCalendarDateRaw(
  calendar: CalendarId,
  fields: CalendarFields,
  duration: DateDuration,
  overflow: Overflow = 'constrain'
): CalendarDate {
  overflowCheck(overflow)
  const native = nativeTemporal()
  if (native) return native.calendarAdd(calendar, fields, duration, overflow)
  const original = calendarFromEpochDayRaw(
    calendar,
    calendarToEpochDayRaw(calendar, fields, 'reject')
  )
  const values = [
    duration.years ?? 0,
    duration.months ?? 0,
    duration.weeks ?? 0,
    duration.days ?? 0,
  ].map(integer)
  if (values.some(x => x < 0) && values.some(x => x > 0))
    throw new RangeError('Mixed duration signs')
  const {year, month} = addYearMonth(
    calendar,
    original,
    values[0],
    values[1],
    overflow
  )
  const epoch = calendarToEpochDayRaw(
    calendar,
    {year, month, day: original.day},
    overflow
  )
  return calendarFromEpochDayRaw(
    calendar,
    epoch + integer(7 * values[2] + values[3])
  )
}
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

export function calendarMonthSerial(
  calendar: CalendarId,
  year: number,
  month: number
): number {
  calendarCheck(calendar)
  const native = nativeTemporal()
  if (native) return native.calendarMonthSerial(calendar, year, month)
  if (isLunisolar(calendar)) return tableMonthSerial(calendar, year, month)
  return calendar === 'hebrew'
    ? elapsedMonths(year) + month - 1
    : year * monthsInYear(calendar, year) + month - 1
}
export function calendarDateUntilRaw(
  calendar: CalendarId,
  one: number,
  two: number,
  largest: string
): DateDuration {
  const native = nativeTemporal()
  if (native) return native.calendarUntil(calendar, one, two, largest)
  const first = calendarFromEpochDayRaw(calendar, one),
    last = calendarFromEpochDayRaw(calendar, two)
  const result = {years: 0, months: 0, weeks: 0, days: 0},
    sign = Math.sign(two - one)
  if (!sign) return result
  // Difference prefixes compare unregulated days and month codes, not clamped dates.
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
  result.days = two - anchor
  if (largest === 'week') {
    result.weeks = Math.trunc(result.days / 7) || 0
    result.days = result.days % 7 || 0
  }
  return result
}
const japaneseEras = [
  [18017, 'reiwa', 2018],
  [6947, 'heisei', 1988],
  [-15713, 'showa', 1925],
  [-20974, 'taisho', 1911],
  [-35428, 'meiji', 1867],
] as const
export function calendarEra(
  calendar: CalendarId,
  epoch: number,
  extended = false
): {era: string; eraYear: number} | undefined {
  const native = nativeTemporal()
  if (native) {
    if (!extended) dayCheck(epoch)
    return native.calendarEra(calendar, epoch)
  }
  const {year} = (extended ? calendarFromEpochDayRaw : calendarFromEpochDay)(
    calendar,
    epoch
  )
  switch (calendar) {
    case 'iso8601':
    case 'chinese':
    case 'dangi':
      return undefined
    case 'buddhist':
      return {era: 'be', eraYear: year}
    case 'coptic':
    case 'hebrew':
      return {era: 'am', eraYear: year}
    case 'ethiopic':
      return {
        era: year > 0 ? 'am' : 'aa',
        eraYear: year > 0 ? year : year + 5500,
      }
    case 'ethioaa':
      return {era: 'aa', eraYear: year}
    case 'indian':
      return {era: 'shaka', eraYear: year}
    case 'persian':
      return {era: 'ap', eraYear: year}
    case 'roc':
      return {
        era: year > 0 ? 'roc' : 'broc',
        eraYear: year > 0 ? year : 1 - year,
      }
    case 'islamic-umalqura':
    case 'islamic-civil':
    case 'islamic-tbla':
      return {era: year > 0 ? 'ah' : 'bh', eraYear: year > 0 ? year : 1 - year}
    case 'japanese':
      for (const [start, era, offset] of japaneseEras)
        if (epoch >= start) return {era, eraYear: year - offset}
  }
  return {era: year > 0 ? 'ce' : 'bce', eraYear: year > 0 ? year : 1 - year}
}
export function calendarYearFromEra(
  calendar: CalendarId,
  era: string,
  eraYear: number
): number {
  calendarCheck(calendar)
  integer(eraYear)
  const native = nativeTemporal()
  if (native) return native.calendarYearFromEra(calendar, era, eraYear)
  if (calendar === 'japanese')
    for (const [, name, offset] of japaneseEras)
      if (era === name) return yearCheck(eraYear + offset)
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
  const index = names[calendar]?.indexOf(era) ?? -1
  if (index < 0) throw new RangeError('Invalid era')
  return yearCheck(index === 1 ? 1 - eraYear : eraYear)
}
