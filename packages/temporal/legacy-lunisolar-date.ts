import {
  floor,
  numberFrom,
  numberIsInteger,
  numberIsSafeInteger,
} from '#packages/ecma262-abstract/intrinsics.js'
import {
  calendarFromEpochDayRaw,
  calendarToEpochDayRaw,
} from '#packages/temporal/calendar.js'
import type {LegacyDateTimeProjection} from '#packages/temporal/legacy-extended-date.js'

type Calendar = 'chinese' | 'dangi'
type Resolved = typeof Intl.DateTimeFormat.prototype.resolvedOptions
type RangeParts = typeof Intl.DateTimeFormat.prototype.formatRangeToParts
const Constructor = globalThis.Intl?.DateTimeFormat
const nativeParts = Constructor?.prototype.formatToParts
const NumberConstructor = globalThis.Intl?.NumberFormat
const numberFormat =
  NumberConstructor &&
  Object.getOwnPropertyDescriptor(NumberConstructor.prototype, 'format')?.get
const dayMilliseconds = 86400000
const probes = new Map<string, Intl.DateTimeFormat>()
const positiveEras = new WeakMap<Intl.DateTimeFormat, string>()
const dateTypes = new Set(['year', 'relatedYear', 'yearName', 'month', 'day'])
interface Catalog {
  months: Map<string, number>
  cursor: number
  count: number
  full?: number
  leap?: string
}
const catalogs = new Map<Calendar, Catalog>()
const utc = new WeakMap<Intl.DateTimeFormat, Intl.DateTimeFormat>()
const separators = new WeakMap<Intl.DateTimeFormat, string>()
function isoDay(year: number, month: number, day: number): number {
  return calendarToEpochDayRaw('iso8601', {year, month, day}, 'reject')
}
function probe(
  calendar: Calendar | 'iso8601',
  timeZone: string
): Intl.DateTimeFormat {
  const key = `${calendar}:${timeZone}`
  let result = probes.get(key)
  if (!result) {
    result = new Constructor!('en-US-u-nu-latn', {
      calendar: calendar === 'iso8601' ? 'gregory' : calendar,
      numberingSystem: 'latn',
      timeZone,
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      ...(calendar === 'iso8601' ? {era: 'short' as const} : {}),
    })
    probes.set(key, result)
  }
  return result
}
function fields(
  calendar: Calendar | 'iso8601',
  timeZone: string,
  milliseconds: number
) {
  const formatter = probe(calendar, timeZone)
  const values = new Map<string, string>(
    nativeParts!
      .call(formatter, milliseconds)
      .map(part => [part.type, part.value])
  )
  const year = numberFrom(
    values.get(calendar === 'iso8601' ? 'year' : 'relatedYear')
  )
  const day = numberFrom(values.get('day'))
  const month = /^(\d{1,2})(bis)?$/.exec(values.get('month') || '')
  if (
    !numberIsSafeInteger(year) ||
    !numberIsInteger(day) ||
    day < 1 ||
    day > (calendar === 'iso8601' ? 31 : 30) ||
    !month ||
    +month[1] < 1 ||
    +month[1] > 12
  )
    throw new RangeError('Unsupported host calendar fields')
  let bce = false
  if (calendar === 'iso8601') {
    let positive = positiveEras.get(formatter)
    if (positive === undefined) {
      positive = nativeParts!
        .call(formatter, 0)
        .find(part => part.type === 'era')?.value
      if (!positive) throw new RangeError('Unsupported host Gregorian era')
      positiveEras.set(formatter, positive)
    }
    bce = values.get('era') !== positive
  }
  return {
    year: bce ? 1 - year : year,
    month: numberFrom(month[1]),
    day,
    monthCode: `M${month[1].padStart(2, '0')}${month[2] ? 'L' : ''}`,
  }
}
function catalog(calendar: Calendar, code: string): Catalog {
  let result = catalogs.get(calendar)
  if (!result) {
    const sample = isoDay(2020, 1, 15),
      value = fields(calendar, 'UTC', sample * dayMilliseconds)
    result = {months: new Map(), cursor: sample - value.day + 1, count: 0}
    catalogs.set(calendar, result)
  }
  while (
    (!result.months.has(code) || result.full === undefined || !result.leap) &&
    result.count < 2400
  ) {
    const start = result.cursor,
      value = fields(calendar, 'UTC', start * dayMilliseconds),
      next = start + 32,
      end = next - fields(calendar, 'UTC', next * dayMilliseconds).day + 1
    result.months.set(value.monthCode, start)
    if (end - start === 30) result.full = start
    if (value.monthCode.endsWith('L')) result.leap = value.monthCode
    result.cursor = end
    result.count++
  }
  return result
}
export function calendarLabelFormatter(
  source: Intl.DateTimeFormat,
  options: Intl.ResolvedDateTimeFormatOptions,
  raw: Intl.DateTimeFormatPart[]
): Intl.DateTimeFormat {
  let result = utc.get(source)
  if (!result) {
    const projected = {
      ...options,
      timeZone: 'UTC',
    } as Intl.DateTimeFormatOptions
    // Some hosts omit resolved year options for relatedYear/yearName output.
    if (
      !options.dateStyle &&
      !options.year &&
      raw.some(part => ['relatedYear', 'yearName'].includes(part.type))
    )
      projected.year = 'numeric'
    result = new Constructor!(options.locale, projected)
    utc.set(source, result)
  }
  return result
}

export function legacyISOEpochDay(
  timeZone: string,
  milliseconds: number
): number {
  const value = fields('iso8601', timeZone, milliseconds)
  return isoDay(value.year, value.month, value.day)
}
function part(
  source: Intl.DateTimeFormat,
  epoch: number,
  type: string
): string {
  const value = nativeParts!
    .call(source, epoch * dayMilliseconds)
    .find(part => part.type === type)
  if (!value) throw new RangeError(`Unsupported host calendar pattern: ${type}`)
  return value.value
}
function monthLabel(
  source: Intl.DateTimeFormat,
  calendar: Calendar,
  code: string
): string {
  const data = catalog(calendar, code),
    epoch = data.months.get(code)
  if (epoch !== undefined) return part(source, epoch + 14, 'month')
  if (!code.endsWith('L') || !data.leap)
    throw new RangeError('Unsupported host calendar month')
  const normal = monthLabel(source, calendar, data.leap.slice(0, -1)),
    leap = part(source, data.months.get(data.leap)! + 14, 'month'),
    index = leap.indexOf(normal)
  if (index < 0) throw new RangeError('Unsupported host leap-month pattern')
  return (
    leap.slice(0, index) +
    monthLabel(source, calendar, code.slice(0, -1)) +
    leap.slice(index + normal.length)
  )
}

export function correctLunisolarParts(
  value: LegacyDateTimeProjection,
  raw: Intl.DateTimeFormatPart[],
  resolved: Resolved,
  surrogateMilliseconds?: number,
  expectedEpochDay?: number
): Intl.DateTimeFormatPart[] {
  const options = resolved.call(value.formatter),
    calendar = options.calendar
  if (
    (calendar !== 'chinese' && calendar !== 'dangi') ||
    !raw.some(part => dateTypes.has(part.type))
  )
    return raw
  const iso =
      surrogateMilliseconds === undefined && expectedEpochDay === undefined
        ? fields('iso8601', options.timeZone, value.milliseconds)
        : undefined,
    expected = calendarFromEpochDayRaw(
      calendar,
      expectedEpochDay ??
        (iso
          ? isoDay(iso.year, iso.month, iso.day)
          : floor(value.milliseconds / dayMilliseconds))
    ),
    actual = fields(
      calendar,
      options.timeZone,
      surrogateMilliseconds ?? value.milliseconds
    )
  if (
    actual.year === expected.year &&
    actual.monthCode === expected.monthCode &&
    actual.day === expected.day
  )
    return raw
  const labels = calendarLabelFormatter(value.formatter, options, raw),
    changes = new Map<string, string>()
  if (actual.day !== expected.day && raw.some(part => part.type === 'day')) {
    const data = catalog(calendar, 'M01')
    changes.set('day', part(labels, data.full! + expected.day - 1, 'day'))
  }
  if (
    actual.monthCode !== expected.monthCode &&
    raw.some(part => part.type === 'month')
  )
    changes.set('month', monthLabel(labels, calendar, expected.monthCode))
  if (actual.year !== expected.year) {
    const cycleYear = 2000 + ((((expected.year - 2000) % 60) + 60) % 60)
    for (const item of raw) {
      const type: string = item.type
      if (type === 'yearName')
        changes.set(item.type, part(labels, isoDay(cycleYear, 7, 1), item.type))
      else if (type === 'year' || type === 'relatedYear') {
        if (!NumberConstructor || !numberFormat)
          throw new RangeError(
            'Calendar year correction requires Intl.NumberFormat'
          )
        const format = numberFormat.call(
            new NumberConstructor(options.locale, {
              numberingSystem: options.numberingSystem,
              useGrouping: false,
              maximumFractionDigits: 0,
            })
          ),
          sample = part(labels, isoDay(2001, 7, 1), item.type),
          short = sample !== format(2001)
        changes.set(
          item.type,
          short
            ? numberFormat.call(
                new NumberConstructor(options.locale, {
                  numberingSystem: options.numberingSystem,
                  useGrouping: false,
                  minimumIntegerDigits: 2,
                  maximumFractionDigits: 0,
                })
              )(((expected.year % 100) + 100) % 100)
            : format(expected.year)
        )
      }
    }
  }
  return changes.size
    ? raw.map(item =>
        changes.has(item.type)
          ? {...item, value: changes.get(item.type)!}
          : item
      )
    : raw
}

export function lunisolarRangeParts(
  first: LegacyDateTimeProjection,
  last: LegacyDateTimeProjection,
  parts: RangeParts,
  resolved: Resolved
): Intl.DateTimeRangeFormatPart[] | undefined {
  const calendar = resolved.call(first.formatter).calendar
  if (
    (calendar !== 'chinese' && calendar !== 'dangi') ||
    !nativeParts ||
    !parts
  )
    return undefined
  const raw = parts.call(
      first.formatter,
      first.milliseconds,
      last.milliseconds
    ),
    firstRaw = nativeParts.call(first.formatter, first.milliseconds),
    lastRaw = nativeParts.call(last.formatter, last.milliseconds),
    start = correctLunisolarParts(first, firstRaw, resolved),
    end = correctLunisolarParts(last, lastRaw, resolved)
  if (start === firstRaw && end === lastRaw) return raw
  return joinCalendarRangeParts(first.formatter, start, end, parts)
}

export function joinCalendarRangeParts(
  formatter: Intl.DateTimeFormat,
  start: Intl.DateTimeFormatPart[],
  end: Intl.DateTimeFormatPart[],
  parts: RangeParts
): Intl.DateTimeRangeFormatPart[] {
  if (
    start.map(part => part.value).join('') ===
    end.map(part => part.value).join('')
  )
    return start.map(part => ({...part, source: 'shared'}))
  let separator = separators.get(formatter)
  if (separator === undefined) {
    const sample = parts.call(formatter, 946718033000, 1025966286000),
      end = sample.findIndex(part => part.source === 'endRange')
    let start = end - 1
    while (start >= 0 && sample[start].source !== 'startRange') start--
    if (start < 0 || end < 0)
      throw new RangeError('Unsupported host calendar range pattern')
    separator = sample
      .slice(start + 1, end)
      .map(part => part.value)
      .join('')
    separators.set(formatter, separator)
  }
  return [
    ...start.map(part => ({...part, source: 'startRange' as const})),
    {type: 'literal', value: separator, source: 'shared'},
    ...end.map(part => ({...part, source: 'endRange' as const})),
  ]
}
