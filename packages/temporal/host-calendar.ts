import {
  RangeErrorConstructor,
  floor,
  mathAbs,
  numberFrom,
  numberIsInteger,
  numberIsSafeInteger,
  setDataProperty,
} from '#packages/ecma262-abstract/intrinsics.js'
import {YearFromTime} from '#packages/ecma262-abstract/DateOperations.js'
import {
  approximateLunisolarYear,
  lunisolarMonthSerial,
  lunisolarMonthEpoch,
} from '#packages/temporal/lunisolar.js'
import {
  compactCalendarYear,
  type CalendarYearData,
} from '#packages/temporal/host-calendar-data.js'

export type HostTableCalendar = 'chinese' | 'dangi' | 'islamic-umalqura'
const Constructor = globalThis.Intl?.DateTimeFormat
const parts = Constructor?.prototype.formatToParts
const resolved = Constructor?.prototype.resolvedOptions
const apply = Reflect.apply
const mapGet = Map.prototype.get
const mapSet = Map.prototype.set
const mapDelete = Map.prototype.delete
const mapKeys = Map.prototype.keys
const mapSize = Object.getOwnPropertyDescriptor(Map.prototype, 'size')!.get!
const mapNext = Object.getPrototypeOf(new Map().keys()).next
const dayMilliseconds = 86400000
const limit = 100000000
const formatters = new Map<HostTableCalendar, Intl.DateTimeFormat>()
const years = new Map<string, CalendarYearData>()
function remember(key: string, value: CalendarYearData): CalendarYearData {
  if (apply(mapSize, years, []) >= 128) {
    const iterator = apply(mapKeys, years, [])
    const first = apply(mapNext, iterator, []) as IteratorResult<string>
    apply(mapDelete, years, [first.value])
  }
  apply(mapSet, years, [key, value])
  return value
}

function fields(calendar: HostTableCalendar, day: number) {
  if (!numberIsInteger(day) || mathAbs(day) > limit)
    throw new RangeErrorConstructor('Host Intl calendar date out of range')
  if (!Constructor || !parts || !resolved)
    throw new RangeErrorConstructor(
      'Temporal requires Intl.DateTimeFormat calendar support'
    )
  let formatter = apply(mapGet, formatters, [calendar]) as
    | Intl.DateTimeFormat
    | undefined
  if (!formatter) {
    formatter = new Constructor('en-US-u-nu-latn', {
      __proto__: null,
      calendar,
      timeZone: 'UTC',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    } as Intl.DateTimeFormatOptions)
    if (apply(resolved, formatter, []).calendar !== calendar)
      throw new RangeErrorConstructor(`Host Intl does not support ${calendar}`)
    apply(mapSet, formatters, [calendar, formatter])
  }
  let year = NaN,
    date = NaN
  const values = apply(parts, formatter, [day * dayMilliseconds])
  for (let index = 0; index < values.length; index++) {
    const part = values[index]
    const type: string = part.type
    if (type === 'relatedYear' || type === 'year') year = numberFrom(part.value)
    else if (type === 'day') date = numberFrom(part.value)
  }
  if (!numberIsSafeInteger(year) || !(date >= 1 && date <= 30))
    throw new RangeErrorConstructor('Unsupported host Intl calendar fields')
  return {year, day: date}
}

export function hostCalendarYear(
  calendar: HostTableCalendar,
  year: number
): CalendarYearData {
  if (!numberIsSafeInteger(year))
    throw new RangeErrorConstructor('Invalid calendar year')
  const key = `${calendar}:${year}`,
    cached = apply(mapGet, years, [key]) as CalendarYearData | undefined
  if (cached) return cached
  if (calendar !== 'islamic-umalqura') {
    const compact = compactCalendarYear(calendar, year)
    return remember(key, compact ?? approximateLunisolarYear(calendar, year))
  }
  let probe = -492148 + 354 * (year - 1) + floor((3 + 11 * year) / 30)
  if (mathAbs(probe) > limit - 800)
    throw new RangeErrorConstructor(
      'Host Intl calendar year requires boundary data'
    )
  probe += 400
  let value = fields(calendar, probe)
  // Find the following year, then walk back by actual host month boundaries.
  for (let attempts = 0; value.year <= year; attempts++) {
    if (attempts >= 3)
      throw new RangeErrorConstructor('Unsupported host calendar year')
    probe += 400
    value = fields(calendar, probe)
  }
  const starts: number[] = []
  let end = NaN
  for (let attempts = 0; value.year >= year; attempts++) {
    if (attempts >= 40)
      throw new RangeErrorConstructor('Unsupported host calendar year')
    const start = probe - value.day + 1
    if (value.year === year) {
      setDataProperty(starts, starts.length, start)
    } else end = start
    probe = start - 1
    value = fields(calendar, probe)
  }
  for (let index = 0; index < floor(starts.length / 2); index++) {
    const opposite = starts.length - index - 1,
      value = starts[index]
    starts[index] = starts[opposite]
    starts[opposite] = value
  }
  if (starts.length !== 12)
    throw new RangeErrorConstructor('Unsupported host calendar year')
  return remember(key, {starts, end, leap: 0})
}

export function hostCalendarDate(
  calendar: HostTableCalendar,
  epoch: number
): {year: number; month: number; day: number} {
  let year =
    calendar === 'islamic-umalqura'
      ? fields(calendar, epoch).year
      : YearFromTime(epoch * dayMilliseconds)
  let data = hostCalendarYear(calendar, year)
  if (epoch < data.starts[0]) data = hostCalendarYear(calendar, --year)
  else if (epoch >= data.end) data = hostCalendarYear(calendar, ++year)
  let month = data.starts.length
  while (data.starts[month - 1] > epoch) month--
  return {year, month, day: epoch - data.starts[month - 1] + 1}
}

export function hostCalendarAddMonths(
  calendar: 'chinese' | 'dangi',
  year: number,
  month: number,
  delta: number
): {year: number; month: number} {
  if (!numberIsSafeInteger(delta))
    throw new RangeErrorConstructor('Invalid month count')
  const target =
    lunisolarMonthSerial(hostCalendarYear(calendar, year).starts[month - 1]) +
    delta
  year = YearFromTime(lunisolarMonthEpoch(target) * dayMilliseconds)
  for (;;) {
    const data = hostCalendarYear(calendar, year),
      index = target - lunisolarMonthSerial(data.starts[0])
    if (index < 0) year--
    else if (index >= data.starts.length) year++
    else return {year, month: index + 1}
  }
}

export function hostCalendarMonthDifference(
  calendar: 'chinese' | 'dangi',
  oneYear: number,
  oneMonth: number,
  twoYear: number,
  twoMonth: number
): number {
  return (
    lunisolarMonthSerial(
      hostCalendarYear(calendar, twoYear).starts[twoMonth - 1]
    ) -
    lunisolarMonthSerial(
      hostCalendarYear(calendar, oneYear).starts[oneMonth - 1]
    )
  )
}
