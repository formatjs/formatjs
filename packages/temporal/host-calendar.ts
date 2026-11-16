import {DayFromYear} from '#packages/ecma262-abstract/DateOperations.js'

export type HostTableCalendar = 'chinese' | 'dangi' | 'islamic-umalqura'
interface CalendarYear {
  starts: number[]
  end: number
  leap: number
}
const Constructor = globalThis.Intl?.DateTimeFormat
const parts = Constructor?.prototype.formatToParts
const resolved = Constructor?.prototype.resolvedOptions
const dayMilliseconds = 86400000
const limit = 100000000
const formatters = new Map<HostTableCalendar, Intl.DateTimeFormat>()
const years = new Map<string, CalendarYear>()

function fields(calendar: HostTableCalendar, day: number) {
  if (!Number.isInteger(day) || Math.abs(day) > limit)
    throw new RangeError('Host Intl calendar date out of range')
  if (!Constructor || !parts || !resolved)
    throw new RangeError(
      'Temporal requires Intl.DateTimeFormat calendar support'
    )
  let formatter = formatters.get(calendar)
  if (!formatter) {
    formatter = new Constructor('en-US-u-nu-latn', {
      calendar,
      timeZone: 'UTC',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    })
    if (resolved.call(formatter).calendar !== calendar)
      throw new RangeError(`Host Intl does not support ${calendar}`)
    formatters.set(calendar, formatter)
  }
  let year = NaN,
    month = '',
    date = NaN
  for (const part of parts.call(formatter, day * dayMilliseconds)) {
    const type: string = part.type
    if (type === 'relatedYear' || type === 'year') year = Number(part.value)
    else if (type === 'month') month = part.value
    else if (type === 'day') date = Number(part.value)
  }
  if (!Number.isSafeInteger(year) || !month || !(date >= 1 && date <= 30))
    throw new RangeError('Unsupported host Intl calendar fields')
  return {year, month, day: date}
}

export function hostCalendarYear(
  calendar: HostTableCalendar,
  year: number
): CalendarYear {
  if (!Number.isSafeInteger(year)) throw new RangeError('Invalid calendar year')
  const key = `${calendar}:${year}`,
    cached = years.get(key)
  if (cached) return cached
  let probe =
    calendar === 'islamic-umalqura'
      ? -492148 + 354 * (year - 1) + Math.floor((3 + 11 * year) / 30)
      : DayFromYear(year)
  if (Math.abs(probe) > limit - 800)
    throw new RangeError('Host Intl calendar year requires boundary data')
  probe += 400
  let value = fields(calendar, probe)
  // Find the following year, then walk back by actual host month boundaries.
  for (let attempts = 0; value.year <= year; attempts++) {
    if (attempts >= 3) throw new RangeError('Unsupported host calendar year')
    probe += 400
    value = fields(calendar, probe)
  }
  const starts: number[] = [],
    names: string[] = []
  let end = NaN
  for (let attempts = 0; value.year >= year; attempts++) {
    if (attempts >= 40) throw new RangeError('Unsupported host calendar year')
    const start = probe - value.day + 1
    if (value.year === year) {
      starts.push(start)
      names.push(value.month)
    } else end = start
    probe = start - 1
    value = fields(calendar, probe)
  }
  starts.reverse()
  names.reverse()
  if (starts.length !== 12 && starts.length !== 13)
    throw new RangeError('Unsupported host calendar year')
  let leap = 0
  if (starts.length === 13) {
    for (let index = 1; index < names.length; index++) {
      // ICU numeric Chinese/Dangi months mark the repeated month with "bis".
      if (/bis$/i.test(names[index]) || names[index] === names[index - 1]) {
        leap = index
        break
      }
    }
    if (!leap) throw new RangeError('Unsupported host leap month')
  }
  const result = {starts, end, leap}
  if (years.size >= 128) years.delete(years.keys().next().value!)
  years.set(key, result)
  return result
}

export function hostCalendarDate(
  calendar: HostTableCalendar,
  epoch: number
): {year: number; month: number; day: number} {
  const value = fields(calendar, epoch),
    data = hostCalendarYear(calendar, value.year)
  let month = data.starts.length
  while (data.starts[month - 1] > epoch) month--
  return {year: value.year, month, day: value.day}
}

export function hostCalendarAddMonths(
  calendar: 'chinese' | 'dangi',
  year: number,
  month: number,
  delta: number
): {year: number; month: number} {
  if (!Number.isSafeInteger(delta)) throw new RangeError('Invalid month count')
  month += delta
  while (month < 1) month += hostCalendarYear(calendar, --year).starts.length
  for (;;) {
    const count = hostCalendarYear(calendar, year).starts.length
    if (month <= count) return {year, month}
    month -= count
    year++
  }
}

export function hostCalendarMonthDifference(
  calendar: 'chinese' | 'dangi',
  oneYear: number,
  oneMonth: number,
  twoYear: number,
  twoMonth: number
): number {
  if (oneYear > twoYear)
    return -hostCalendarMonthDifference(
      calendar,
      twoYear,
      twoMonth,
      oneYear,
      oneMonth
    )
  let months = twoMonth - oneMonth
  for (let year = oneYear; year < twoYear; year++)
    months += hostCalendarYear(calendar, year).starts.length
  return months
}
