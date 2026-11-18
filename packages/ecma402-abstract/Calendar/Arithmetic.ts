import {
  DayFromYear,
  DaysInYear,
  YearFromTime,
} from '#packages/ecma262-abstract/DateOperations.js'

// Shared numeric calendar helpers; not named ECMA-402 abstract operations.
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
export type ArithmeticCalendarId = (typeof arithmeticCalendars)[number]

const monthStarts = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334]
const mod = (value: number, divisor: number): number =>
  value - Math.floor(value / divisor) * divisor
function integer(value: number): number {
  if (!Number.isSafeInteger(value))
    throw new RangeError('Expected safe integer')
  return value
}
export function HebrewLeapYear(year: number): boolean {
  return mod(7 * year + 1, 19) < 7
}
export function HebrewElapsedMonths(year: number): number {
  return Math.floor((235 * year - 234) / 19)
}
// Same postponement arithmetic as crates/intl_datetimeformat_calendars/core.rs.
function hebrewDelay(year: number): number {
  const months = HebrewElapsedMonths(year)
  const day = 29 * months + Math.floor((12084 + 13753 * months) / 25920)
  return day + Number(mod(3 * (day + 1), 7) < 3)
}
function IsISOCalendar(calendar: ArithmeticCalendarId): boolean {
  return ['iso8601', 'gregory', 'buddhist', 'japanese', 'roc'].includes(
    calendar
  )
}
function CalendarISOYear(calendar: ArithmeticCalendarId, year: number): number {
  return year + (calendar === 'buddhist' ? -543 : calendar === 'roc' ? 1911 : 0)
}
export function ArithmeticCalendarStartOfYear(
  calendar: ArithmeticCalendarId,
  year: number
): number {
  if (IsISOCalendar(calendar))
    return DayFromYear(CalendarISOYear(calendar, year))
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
// Month and day must already be validated.
export function ArithmeticCalendarToEpochDay(
  calendar: ArithmeticCalendarId,
  year: number,
  month: number,
  day: number
): number {
  if (IsISOCalendar(calendar)) {
    const isoYear = CalendarISOYear(calendar, year)
    return (
      DayFromYear(isoYear) +
      monthStarts[month - 1] +
      Number(month > 2 && DaysInYear(isoYear) === 366) +
      day -
      1
    )
  }
  let epoch = ArithmeticCalendarStartOfYear(calendar, year) + day - 1
  for (let m = 1; m < month; m++)
    epoch += ArithmeticCalendarDaysInMonth(calendar, year, m)
  return epoch
}
export function ArithmeticCalendarMonthsInYear(
  calendar: ArithmeticCalendarId,
  year: number
): number {
  return ['coptic', 'ethiopic', 'ethioaa'].includes(calendar) ||
    (calendar === 'hebrew' && HebrewLeapYear(year))
    ? 13
    : 12
}
export function ArithmeticCalendarDaysInMonth(
  calendar: ArithmeticCalendarId,
  year: number,
  month: number
): number {
  const count = ArithmeticCalendarMonthsInYear(calendar, year)
  if (integer(month) < 1 || month > count)
    throw new RangeError('Invalid calendar month')
  if (IsISOCalendar(calendar)) {
    return month === 12
      ? 31
      : monthStarts[month] -
          monthStarts[month - 1] +
          Number(
            month === 2 && DaysInYear(CalendarISOYear(calendar, year)) === 366
          )
  }
  const length =
    ArithmeticCalendarStartOfYear(calendar, year + 1) -
    ArithmeticCalendarStartOfYear(calendar, year)
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
  const code = month + Number(!HebrewLeapYear(year) && month >= 6)
  if ([4, 7, 9, 11, 13].includes(code)) return 29
  if (code === 2) return length % 10 === 5 ? 30 : 29
  if (code === 3) return length % 10 === 3 ? 29 : 30
  return 30
}
export function ArithmeticCalendarMonthCode(
  calendar: ArithmeticCalendarId,
  year: number,
  month: number
): string {
  const leap = calendar === 'hebrew' && HebrewLeapYear(year)
  if (leap && month === 6) return 'M05L'
  const code = month - Number(leap && month > 6)
  return 'M' + (code < 10 ? '0' : '') + code
}
export function ArithmeticCalendarFromEpochDay(
  calendar: ArithmeticCalendarId,
  epoch: number
): {year: number; month: number; monthCode: string; day: number} {
  const t = epoch * 86400000,
    civilYear = YearFromTime(t)
  if (IsISOCalendar(calendar)) {
    const ordinal = Math.floor(t / 86400000) - DayFromYear(civilYear),
      leap = DaysInYear(civilYear) === 366 ? 1 : 0
    if (!(ordinal >= 0 && ordinal < 365 + leap)) throw new Error('Invalid time')
    const year =
        civilYear -
        (calendar === 'buddhist' ? -543 : calendar === 'roc' ? 1911 : 0),
      // March starts a repeating 153-day, five-month cycle.
      month =
        ordinal < 31
          ? 1
          : ordinal < 59 + leap
            ? 2
            : 3 + Math.floor((5 * (ordinal - 59 - leap) + 2) / 153)
    return {
      year,
      month,
      monthCode: ArithmeticCalendarMonthCode(calendar, year, month),
      day: ordinal - monthStarts[month - 1] - (month > 2 ? leap : 0) + 1,
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
  while (ArithmeticCalendarStartOfYear(calendar, year) > epoch) year--
  while (ArithmeticCalendarStartOfYear(calendar, year + 1) <= epoch) year++
  let month = 1,
    remaining = epoch - ArithmeticCalendarStartOfYear(calendar, year)
  while (remaining >= ArithmeticCalendarDaysInMonth(calendar, year, month))
    remaining -= ArithmeticCalendarDaysInMonth(calendar, year, month++)
  return {
    year,
    month,
    monthCode: ArithmeticCalendarMonthCode(calendar, year, month),
    day: remaining + 1,
  }
}
export const JapaneseEras = [
  [18017, 'reiwa', 2018],
  [6947, 'heisei', 1988],
  [-15713, 'showa', 1925],
  [-20974, 'taisho', 1911],
  [-35428, 'meiji', 1867],
] as const
export function ArithmeticCalendarEra(
  calendar: ArithmeticCalendarId,
  epoch: number,
  year: number
): {era: string; eraYear: number} | undefined {
  switch (calendar) {
    case 'iso8601':
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
    case 'islamic-civil':
    case 'islamic-tbla':
      return {era: year > 0 ? 'ah' : 'bh', eraYear: year > 0 ? year : 1 - year}
    case 'japanese':
      for (const [start, era, offset] of JapaneseEras)
        if (epoch >= start) return {era, eraYear: year - offset}
  }
  return {era: year > 0 ? 'ce' : 'bce', eraYear: year > 0 ? year : 1 - year}
}
