import {
  floor,
  numberIsInteger,
  numberIsSafeInteger,
} from '#packages/ecma262-abstract/intrinsics.js'
import {
  fallbackLunisolar,
  fallbackUmmAlQura,
} from '#packages/temporal/fallback-data.js'
import {
  hostCalendarYear,
  hostCalendarDate,
  hostCalendarAddMonths,
  hostCalendarMonthDifference,
} from '#packages/temporal/host-calendar.js'

declare global {
  interface ImportMeta {
    readonly formatjsTemporalHostCalendar?: boolean
  }
}
export const hostCalendarData: boolean =
  import.meta.formatjsTemporalHostCalendar === true

export type TableCalendarId = 'chinese' | 'dangi' | 'islamic-umalqura'
const alphabet =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'
export function isLunisolar(calendar: string): calendar is 'chinese' | 'dangi' {
  return calendar === 'chinese' || calendar === 'dangi'
}
function data(calendar: 'chinese' | 'dangi') {
  return fallbackLunisolar(calendar)
}
function pattern(calendar: 'chinese' | 'dangi', year: number): number {
  const table = data(calendar),
    index = year - table.firstYear
  if (!numberIsInteger(index) || index < 0 || index * 2 >= table.years.length)
    throw new RangeError('Calendar year out of range')
  return table.dictionary[
    alphabet.indexOf(table.years[index * 2]) * 64 +
      alphabet.indexOf(table.years[index * 2 + 1])
  ]
}
function length(packed: number): number {
  let days = (packed >>> 13 ? 13 : 12) * 29,
    bits = packed & 8191
  while (bits) {
    days++
    bits &= bits - 1
  }
  return days
}
export function tableLeapMonth(
  calendar: 'chinese' | 'dangi',
  year: number
): number {
  if (hostCalendarData) return hostCalendarYear(calendar, year).leap
  return pattern(calendar, year) >>> 13
}
export function tableYearStart(
  calendar: TableCalendarId,
  year: number
): number | undefined {
  if (hostCalendarData) {
    if (calendar === 'islamic-umalqura' && (year < 1300 || year > 1601))
      return undefined
    return hostCalendarYear(calendar, year).starts[0]
  }
  if (calendar === 'islamic-umalqura') {
    const ummAlQura = fallbackUmmAlQura()
    const index = year - ummAlQura.firstYear
    return index >= 0 && index < ummAlQura.startDays.length
      ? ummAlQura.startDays[index]
      : undefined
  }
  const table = data(calendar),
    index = year - table.firstYear
  if (index === table.years.length / 2) return table.endDay
  pattern(calendar, year)
  const block = floor(index / 64)
  let start = table.checkpoints[block]
  for (let i = block * 64; i < index; i++)
    start += length(pattern(calendar, table.firstYear + i))
  return start
}
export function tableMonthLength(
  calendar: TableCalendarId,
  year: number,
  month: number
): number | undefined {
  if (hostCalendarData) {
    if (calendar === 'islamic-umalqura' && (year < 1300 || year > 1600))
      return undefined
    const data = hostCalendarYear(calendar, year)
    return (data.starts[month] ?? data.end) - data.starts[month - 1]
  }
  if (calendar === 'islamic-umalqura') {
    const ummAlQura = fallbackUmmAlQura()
    const index = year - ummAlQura.firstYear
    return index >= 0 && index < ummAlQura.monthLengths.length
      ? 29 + ((ummAlQura.monthLengths[index] >>> (month - 1)) & 1)
      : undefined
  }
  return 29 + ((pattern(calendar, year) >>> (month - 1)) & 1)
}
export function tableMonthSerial(
  calendar: 'chinese' | 'dangi',
  year: number,
  month: number
): number {
  if (hostCalendarData)
    return hostCalendarMonthDifference(calendar, 1970, 1, year, month)
  const table = data(calendar),
    index = year - table.firstYear
  pattern(calendar, year)
  const block = floor(index / 64)
  let serial = table.monthCheckpoints[block]
  for (let i = block * 64; i < index; i++)
    serial += tableLeapMonth(calendar, table.firstYear + i) ? 13 : 12
  return serial + month - 1
}
export function tableYearMonth(
  calendar: 'chinese' | 'dangi',
  serial: number
): {year: number; month: number} {
  if (hostCalendarData) return hostCalendarAddMonths(calendar, 1970, 1, serial)
  const table = data(calendar),
    checkpoints = table.monthCheckpoints
  if (!numberIsSafeInteger(serial) || serial < 0)
    throw new RangeError('Calendar month out of range')
  let low = 0,
    high = checkpoints.length
  while (low + 1 < high) {
    const mid = floor((low + high) / 2)
    if (checkpoints[mid] <= serial) low = mid
    else high = mid
  }
  let year = table.firstYear + low * 64,
    remaining = serial - checkpoints[low]
  for (;;) {
    const count = tableLeapMonth(calendar, year) ? 13 : 12
    if (remaining < count) return {year, month: remaining + 1}
    remaining -= count
    year++
  }
}
export function tableDate(
  calendar: 'chinese' | 'dangi',
  epoch: number
): {year: number; month: number; day: number} {
  if (hostCalendarData) return hostCalendarDate(calendar, epoch)
  const table = data(calendar),
    checkpoints = table.checkpoints
  if (epoch < checkpoints[0] || epoch >= table.endDay)
    throw new RangeError('Calendar date out of range')
  let low = 0,
    high = checkpoints.length
  while (low + 1 < high) {
    const mid = floor((low + high) / 2)
    if (checkpoints[mid] <= epoch) low = mid
    else high = mid
  }
  let year = table.firstYear + low * 64,
    remaining = epoch - checkpoints[low]
  while (remaining >= length(pattern(calendar, year)))
    remaining -= length(pattern(calendar, year++))
  let month = 1
  while (remaining >= tableMonthLength(calendar, year, month)!)
    remaining -= tableMonthLength(calendar, year, month++)!
  return {year, month, day: remaining + 1}
}

export function tableAddMonths(
  calendar: 'chinese' | 'dangi',
  year: number,
  month: number,
  months: number
): {year: number; month: number} {
  return hostCalendarData
    ? hostCalendarAddMonths(calendar, year, month, months)
    : tableYearMonth(calendar, tableMonthSerial(calendar, year, month) + months)
}

export function tableMonthDifference(
  calendar: 'chinese' | 'dangi',
  oneYear: number,
  oneMonth: number,
  twoYear: number,
  twoMonth: number
): number {
  return hostCalendarData
    ? hostCalendarMonthDifference(
        calendar,
        oneYear,
        oneMonth,
        twoYear,
        twoMonth
      )
    : tableMonthSerial(calendar, twoYear, twoMonth) -
        tableMonthSerial(calendar, oneYear, oneMonth)
}
