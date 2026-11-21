import {floor} from '#packages/ecma262-abstract/intrinsics.js'
import {beforeHijrah} from '@formatjs_generated/datetimeformat.calendars/fallback-eras.js'
import {
  calendarEra,
  calendarFromEpochDayRaw,
  calendarToEpochDayRaw,
  calendarYearFromEra,
  calendarIds,
  monthsInYear,
  type CalendarId,
} from '#packages/temporal/calendar.js'
import {
  correctLunisolarParts,
  joinCalendarRangeParts,
  calendarLabelFormatter,
  legacyISOEpochDay,
} from '#packages/temporal/legacy-lunisolar-date.js'
import type {LegacyDateTimeProjection} from '#packages/temporal/legacy-extended-date.js'

type Parts = typeof Intl.DateTimeFormat.prototype.formatToParts
type Resolved = typeof Intl.DateTimeFormat.prototype.resolvedOptions
type RangeParts = typeof Intl.DateTimeFormat.prototype.formatRangeToParts
const Constructor = globalThis.Intl?.DateTimeFormat
const NumberConstructor = globalThis.Intl?.NumberFormat
const numberFormat =
  NumberConstructor &&
  Object.getOwnPropertyDescriptor(NumberConstructor.prototype, 'format')?.get
const dayMilliseconds = 86400000
const limit = 8640000000000000
const cycle = 146097 * dayMilliseconds
const reference = 1609459200000
const representatives = new Map<string, number>()
const numbers = new WeakMap<
  Intl.DateTimeFormat,
  Map<number, (value: number) => string>
>()
const eraWidths = new WeakMap<
  Intl.DateTimeFormat,
  'long' | 'short' | 'narrow'
>()
const eraLabels = new WeakMap<Intl.DateTimeFormat, Map<string, string>>()
const clockFormatters = new WeakMap<Intl.DateTimeFormat, Intl.DateTimeFormat>()
const clockTypes = new Set([
  'weekday',
  'hour',
  'minute',
  'second',
  'fractionalSecond',
  'dayPeriod',
  'timeZoneName',
])

function clipped(value: LegacyDateTimeProjection): boolean {
  return value.plain === true && Math.abs(value.milliseconds) > limit
}
function number(
  source: Intl.DateTimeFormat,
  options: Intl.ResolvedDateTimeFormatOptions,
  digits: number
): (value: number) => string {
  let cache = numbers.get(source)
  if (!cache) {
    cache = new Map()
    numbers.set(source, cache)
  }
  const existing = cache.get(digits)
  if (existing) return existing
  if (!NumberConstructor || !numberFormat)
    throw new RangeError('Extended calendar dates require Intl.NumberFormat')
  const result = numberFormat.call(
    new NumberConstructor(options.locale, {
      numberingSystem: options.numberingSystem,
      useGrouping: false,
      minimumIntegerDigits: digits,
      maximumFractionDigits: 0,
    })
  )
  cache.set(digits, result)
  return result
}
function representative(
  calendar: CalendarId,
  code: string,
  leap: boolean
): number {
  const key = `${calendar}:${code}:${leap}`
  const cached = representatives.get(key)
  if (cached !== undefined) return cached
  const first = calendarFromEpochDayRaw(
    calendar,
    floor(reference / dayMilliseconds)
  ).year
  for (let delta = 0; delta < 32; delta++) {
    const year = first + delta
    if (calendar === 'hebrew' && (monthsInYear(calendar, year) === 13) !== leap)
      continue
    let epoch: number
    try {
      epoch = calendarToEpochDayRaw(
        calendar,
        {year, monthCode: code, day: 3},
        'reject'
      )
    } catch (error) {
      if (error instanceof RangeError) continue
      throw error
    }
    representatives.set(key, epoch)
    return epoch
  }
  throw new RangeError('No host calendar label example')
}
function firstPart(parts: Intl.DateTimeFormatPart[], type: string): string {
  const value = parts.find(part => part.type === type)
  if (!value) throw new RangeError(`Unsupported host calendar pattern: ${type}`)
  return value.value
}
function eraOptions(
  options: Intl.ResolvedDateTimeFormatOptions,
  calendar: string,
  era: 'long' | 'short' | 'narrow'
): Intl.DateTimeFormatOptions {
  return options.dateStyle || options.timeStyle
    ? {
        calendar,
        era,
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        timeZone: 'UTC',
      }
    : ({
        ...options,
        calendar,
        era,
        timeZone: 'UTC',
      } as Intl.DateTimeFormatOptions)
}
function eraWidth(
  source: Intl.DateTimeFormat,
  options: Intl.ResolvedDateTimeFormatOptions,
  raw: Intl.DateTimeFormatPart[],
  surrogate: number,
  parts: Parts
): 'long' | 'short' | 'narrow' {
  const existing = eraWidths.get(source)
  if (existing) return existing
  if (
    options.era === 'long' ||
    options.era === 'short' ||
    options.era === 'narrow'
  ) {
    eraWidths.set(source, options.era)
    return options.era
  }
  const original = firstPart(raw, 'era')
  for (const width of ['long', 'short', 'narrow'] as const) {
    const formatter = new Constructor!(
      options.locale,
      eraOptions(options, options.calendar, width)
    )
    if (firstPart(parts.call(formatter, surrogate), 'era') === original) {
      eraWidths.set(source, width)
      return width
    }
  }
  throw new RangeError('Unsupported host era width')
}
function eraLabel(
  source: Intl.DateTimeFormat,
  calendar: CalendarId,
  era: string,
  options: Intl.ResolvedDateTimeFormatOptions,
  width: 'long' | 'short' | 'narrow',
  sample: number,
  parts: Parts
): string {
  let cache = eraLabels.get(source)
  if (!cache) {
    cache = new Map()
    eraLabels.set(source, cache)
  }
  const key = `${calendar}:${era}:${width}`,
    existing = cache.get(key)
  if (existing !== undefined) return existing
  if (era === 'bh') {
    let locale = options.locale.split('-u-')[0]
    while (!beforeHijrah[locale] && locale.includes('-'))
      locale = locale.slice(0, locale.lastIndexOf('-'))
    const value = (beforeHijrah[locale] ?? beforeHijrah.en)[
      width === 'long' ? 0 : width === 'short' ? 1 : 2
    ]
    cache.set(key, value)
    return value
  }
  if (calendar === 'japanese' && (era === 'bce' || era === 'ce')) {
    calendar = 'gregory'
    sample = calendarToEpochDayRaw(
      'iso8601',
      {year: era === 'bce' ? 0 : 2000, month: 1, day: 1},
      'reject'
    )
  } else if (calendar === 'japanese') {
    sample = calendarToEpochDayRaw(
      'iso8601',
      {year: calendarYearFromEra(calendar, era, 10), month: 7, day: 1},
      'reject'
    )
  } else if (era === 'broc' || (calendar === 'ethiopic' && era === 'aa')) {
    sample = calendarToEpochDayRaw(
      calendar,
      {year: 0, month: 1, day: 1},
      'reject'
    )
  }
  const formatter = new Constructor!(
    options.locale,
    eraOptions(options, calendar, width)
  )
  const value = firstPart(
    parts.call(formatter, sample * dayMilliseconds),
    'era'
  )
  cache.set(key, value)
  return value
}

export function legacyCalendarParts(
  value: LegacyDateTimeProjection,
  parts: Parts,
  resolved: Resolved
): Intl.DateTimeFormatPart[] | undefined {
  const options = resolved.call(value.formatter),
    calendar = options.calendar as CalendarId
  if (
    calendar === 'iso8601' ||
    calendar === 'gregory' ||
    !calendarIds.includes(calendar)
  )
    return undefined
  if (value.plain !== true) {
    if (
      !Number.isFinite(value.milliseconds) ||
      Math.abs(value.milliseconds) > limit
    )
      return undefined
    const lunar = calendar === 'chinese' || calendar === 'dangi'
    let epoch = lunar
      ? undefined
      : legacyISOEpochDay(options.timeZone, value.milliseconds)
    let raw: Intl.DateTimeFormatPart[]
    let labels: Intl.DateTimeFormat
    let surrogate: number | undefined
    try {
      raw = parts.call(value.formatter, value.milliseconds)
      if (
        !raw.some(part =>
          ['year', 'month', 'day', 'era', 'relatedYear', 'yearName'].includes(
            part.type
          )
        )
      )
        return raw
      if (lunar) return correctLunisolarParts(value, raw, resolved)
      labels = calendarLabelFormatter(value.formatter, options, raw)
    } catch (error) {
      if (!(error instanceof RangeError) && !(error instanceof TypeError))
        throw error
      epoch ??= legacyISOEpochDay(options.timeZone, value.milliseconds)
      // Some host calendars fail at valid Date bounds; retain their clock and zone via Gregorian fields.
      let clock = clockFormatters.get(value.formatter)
      if (!clock) {
        clock = new Constructor!(options.locale, {
          ...options,
          calendar: 'gregory',
        } as Intl.DateTimeFormatOptions)
        clockFormatters.set(value.formatter, clock)
      }
      const clockParts = parts.call(clock, value.milliseconds)
      labels = calendarLabelFormatter(
        value.formatter,
        options,
        lunar ? parts.call(value.formatter, reference) : clockParts
      )
      const local = epoch * dayMilliseconds
      surrogate = local - floor((local - 946684800000) / cycle) * cycle
      raw = parts
        .call(labels, surrogate)
        .map(part =>
          clockTypes.has(part.type)
            ? (clockParts.find(item => item.type === part.type) ?? part)
            : part
        )
    }
    // Keep the original local day when labels use a UTC surrogate.
    if (lunar)
      return correctLunisolarParts(
        {...value, formatter: labels},
        raw,
        resolved,
        surrogate,
        epoch
      )
    return restoreCalendarParts(value, raw, epoch!, labels, options, parts)
  }
  // Whole Gregorian cycles preserve weekday and clock in the plain UTC projection.
  const surrogate =
      value.milliseconds -
      floor((value.milliseconds - 946684800000) / cycle) * cycle,
    raw = parts.call(value.formatter, surrogate)
  if (
    !raw.some(part =>
      ['year', 'month', 'day', 'era', 'relatedYear', 'yearName'].includes(
        part.type
      )
    )
  )
    return raw
  if (calendar === 'chinese' || calendar === 'dangi')
    return correctLunisolarParts(value, raw, resolved, surrogate)
  return restoreCalendarParts(
    value,
    raw,
    floor(value.milliseconds / dayMilliseconds),
    value.formatter,
    options,
    parts
  )
}

function restoreCalendarParts(
  value: LegacyDateTimeProjection,
  raw: Intl.DateTimeFormatPart[],
  epoch: number,
  labels: Intl.DateTimeFormat,
  options: Intl.ResolvedDateTimeFormatOptions,
  parts: Parts
): Intl.DateTimeFormatPart[] {
  const calendar = options.calendar as CalendarId,
    date = calendarFromEpochDayRaw(calendar, epoch),
    era = calendarEra(calendar, epoch, true),
    year = era?.eraYear ?? date.year,
    sample = representative(
      calendar,
      date.monthCode,
      monthsInYear(calendar, date.year) === 13
    ),
    controls = parts.call(labels, sample * dayMilliseconds),
    sampleEra = calendarEra(calendar, sample, true),
    sampleYear =
      sampleEra?.eraYear ?? calendarFromEpochDayRaw(calendar, sample).year,
    format = number(value.formatter, options, 1),
    formatTwo = number(value.formatter, options, 2),
    short = (value: number): string =>
      Array.from(formatTwo(value)).slice(-2).join(''),
    changes = new Map<string, string>()
  if (raw.some(part => part.type === 'year')) {
    const sampleText = firstPart(controls, 'year'),
      two =
        options.year === '2-digit' ||
        (options.year === undefined &&
          sampleText !== format(sampleYear) &&
          sampleText === short(sampleYear))
    changes.set('year', two ? short(year) : format(year))
    if (
      calendar === 'japanese' &&
      year === 1 &&
      era?.era !== 'ce' &&
      era?.era !== 'bce' &&
      !clipped(value)
    )
      changes.set(
        'year',
        firstPart(parts.call(value.formatter, value.milliseconds), 'year')
      )
  }
  if (raw.some(part => part.type === 'month'))
    changes.set('month', firstPart(controls, 'month'))
  if (raw.some(part => part.type === 'day')) {
    const two = firstPart(controls, 'day') === formatTwo(3)
    changes.set('day', two ? formatTwo(date.day) : format(date.day))
  }
  if (era && raw.some(part => part.type === 'era'))
    changes.set(
      'era',
      eraLabel(
        value.formatter,
        calendar,
        era.era,
        options,
        eraWidth(
          value.formatter,
          options,
          controls,
          sample * dayMilliseconds,
          parts
        ),
        sample,
        parts
      )
    )
  if (
    raw.every(
      part => !changes.has(part.type) || changes.get(part.type) === part.value
    )
  )
    return raw
  return raw.map(part =>
    changes.has(part.type) ? {...part, value: changes.get(part.type)!} : part
  )
}

export function legacyCalendarRangeParts(
  first: LegacyDateTimeProjection,
  last: LegacyDateTimeProjection,
  parts: Parts,
  rangeParts: RangeParts,
  resolved: Resolved
): Intl.DateTimeRangeFormatPart[] | undefined {
  const calendar = resolved.call(first.formatter).calendar
  if (
    calendar === 'iso8601' ||
    calendar === 'gregory' ||
    !calendarIds.includes(calendar as CalendarId)
  )
    return undefined
  const start =
      legacyCalendarParts(first, parts, resolved) ??
      correctLunisolarParts(
        first,
        parts.call(first.formatter, first.milliseconds),
        resolved
      ),
    end =
      legacyCalendarParts(last, parts, resolved) ??
      correctLunisolarParts(
        last,
        parts.call(last.formatter, last.milliseconds),
        resolved
      )
  if (!clipped(first) && !clipped(last)) {
    try {
      const same = (
        one: Intl.DateTimeFormatPart[],
        two: Intl.DateTimeFormatPart[]
      ): boolean =>
        one.length === two.length &&
        one.every(
          (part, index) =>
            part.type === two[index].type && part.value === two[index].value
        )
      if (
        same(start, parts.call(first.formatter, first.milliseconds)) &&
        same(end, parts.call(last.formatter, last.milliseconds))
      )
        return undefined
    } catch (error) {
      if (!(error instanceof RangeError) && !(error instanceof TypeError))
        throw error
    }
  }
  return joinCalendarRangeParts(first.formatter, start, end, rangeParts)
}
