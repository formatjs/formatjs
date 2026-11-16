import {
  fallbackLunisolar,
  fallbackUmmAlQura,
} from '#packages/temporal/fallback-data.js'

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
  if (!Number.isInteger(index) || index < 0 || index * 2 >= table.years.length)
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
  return pattern(calendar, year) >>> 13
}
export function tableYearStart(
  calendar: TableCalendarId,
  year: number
): number | undefined {
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
  const block = Math.floor(index / 64)
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
  const table = data(calendar),
    index = year - table.firstYear
  pattern(calendar, year)
  const block = Math.floor(index / 64)
  let serial = table.monthCheckpoints[block]
  for (let i = block * 64; i < index; i++)
    serial += tableLeapMonth(calendar, table.firstYear + i) ? 13 : 12
  return serial + month - 1
}
export function tableYearMonth(
  calendar: 'chinese' | 'dangi',
  serial: number
): {year: number; month: number} {
  const table = data(calendar),
    checkpoints = table.monthCheckpoints
  if (!Number.isSafeInteger(serial) || serial < 0)
    throw new RangeError('Calendar month out of range')
  let low = 0,
    high = checkpoints.length
  while (low + 1 < high) {
    const mid = Math.floor((low + high) / 2)
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
  const table = data(calendar),
    checkpoints = table.checkpoints
  if (epoch < checkpoints[0] || epoch >= table.endDay)
    throw new RangeError('Calendar date out of range')
  let low = 0,
    high = checkpoints.length
  while (low + 1 < high) {
    const mid = Math.floor((low + high) / 2)
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
