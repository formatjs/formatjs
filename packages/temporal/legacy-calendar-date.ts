import {
  RangeErrorConstructor,
  TypeErrorConstructor,
  arrayEvery,
  arrayIncludes,
  arraySome,
  floor,
  mathAbs,
  numberIsFinite,
} from '#packages/ecma262-abstract/intrinsics.js'
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
  hostBuddhistMonth,
  legacyISOEpochDay,
} from '#packages/temporal/legacy-lunisolar-date.js'
import type {LegacyDateTimeProjection} from '#packages/temporal/legacy-extended-date.js'

type Parts = typeof Intl.DateTimeFormat.prototype.formatToParts
type Resolved = typeof Intl.DateTimeFormat.prototype.resolvedOptions
type RangeParts = typeof Intl.DateTimeFormat.prototype.formatRangeToParts

type NumericWidths = [numeric: string, twoDigit: string]

interface NumericRangeDay {
  raw: NumericWidths | undefined
  corrected: NumericWidths
  single: string
  identify: (text: string) => NumericWidths | undefined
}

interface NumericRangeYear {
  era: string
  raw: string
  corrected: string
  month: NumericWidths | undefined
  textualMonth: number | undefined
  day: NumericRangeDay | undefined
  weekday: string | undefined
}

interface CalendarRangeFields {
  year: number | undefined
  numericYear: NumericRangeYear | undefined
}

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
  // ECMA-262 §21.4.1.31 step 2: detect plain projections outside the Date
  // range.
  return value.plain === true && mathAbs(value.milliseconds) > limit
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
    throw new RangeErrorConstructor(
      'Extended calendar dates require Intl.NumberFormat'
    )
  // ECMA-402 §11.5.4 steps 3–5 and 7–10: reuse localized ungrouped integer
  // digits.
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
  // ECMA-402 §11.5.4 step 15.f.x: pick an in-range control for a localized
  // month label.
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
      // ECMA-402 §11.5.11 step 5.a: resolve the requested month code in the
      // control year.
      epoch = calendarToEpochDayRaw(
        calendar,
        {year, monthCode: code, day: 3},
        'reject'
      )
    } catch (error) {
      if (error instanceof RangeErrorConstructor) continue
      throw error
    }
    representatives.set(key, epoch)
    return epoch
  }
  throw new RangeErrorConstructor('No host calendar label example')
}
function firstPart(parts: Intl.DateTimeFormatPart[], type: string): string {
  // ECMA-402 §11.5.7 steps 4.b–c: read the host part with the requested type.
  const value = parts.find(part => part.type === type)
  if (!value)
    throw new RangeErrorConstructor(
      `Unsupported host calendar pattern: ${type}`
    )
  return value.value
}
function eraOptions(
  options: Intl.ResolvedDateTimeFormatOptions,
  calendar: string,
  era: 'long' | 'short' | 'narrow'
): Intl.DateTimeFormatOptions {
  // ECMA-402 §11.5.4 step 15.f.x: isolate era labels at the requested width.
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
  // ECMA-402 §11.5.4 step 15.f.ii: prefer the resolved era width.
  if (
    options.era === 'long' ||
    options.era === 'short' ||
    options.era === 'narrow'
  ) {
    eraWidths.set(source, options.era)
    return options.era
  }
  // ECMA-402 §11.5.4 step 15.f.x: infer style-selected era width from host
  // labels.
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
  throw new RangeErrorConstructor('Unsupported host era width')
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
  // ECMA-402 §11.5.4 step 15.f.x: supply the before-Hijrah label from locale
  // data.
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
  // ECMA-402 §11.5.11 step 5.a: choose a control date in the requested era.
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
  // ECMA-402 §11.5.4 step 15.f.x: read the host label for that era and width.
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
  resolved: Resolved,
  rangeFields?: CalendarRangeFields
): Intl.DateTimeFormatPart[] | undefined {
  // ECMA-402 §11.5.4 step 12: select the calendar for date-field restoration.
  const options = resolved.call(value.formatter),
    calendar = options.calendar as CalendarId
  if (
    calendar === 'iso8601' ||
    calendar === 'gregory' ||
    !arrayIncludes(calendarIds, calendar)
  )
    return undefined
  if (value.plain !== true) {
    // ECMA-262 §21.4.1.31 steps 1–2: leave invalid Number inputs to the host.
    if (
      !numberIsFinite(value.milliseconds) ||
      mathAbs(value.milliseconds) > limit
    )
      return undefined
    const lunar = calendar === 'chinese' || calendar === 'dangi'
    // ECMA-402 §11.5.11 steps 3–5: recover the local ISO day before calendar
    // conversion.
    let epoch = lunar
      ? undefined
      : legacyISOEpochDay(options.timeZone, value.milliseconds)
    let raw: Intl.DateTimeFormatPart[]
    let labels: Intl.DateTimeFormat
    let surrogate: number | undefined
    try {
      // ECMA-402 §11.5.7 step 1: ask the host for the original partition.
      raw = parts.call(value.formatter, value.milliseconds)
      if (
        !arraySome(raw, part =>
          arrayIncludes(
            ['year', 'month', 'day', 'era', 'relatedYear', 'yearName'],
            part.type
          )
        )
      )
        return raw
      if (lunar) return correctLunisolarParts(value, raw, resolved)
      labels = calendarLabelFormatter(value.formatter, options, raw)
    } catch (error) {
      if (
        !(error instanceof RangeErrorConstructor) &&
        !(error instanceof TypeErrorConstructor)
      )
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
      // ECMA-402 §11.5.4 steps 12 and 15.c–g: take clock and zone parts from
      // the real instant.
      const clockParts = parts.call(clock, value.milliseconds)
      labels = calendarLabelFormatter(
        value.formatter,
        options,
        lunar ? parts.call(value.formatter, reference) : clockParts
      )
      const local = epoch * dayMilliseconds
      surrogate = local - floor((local - 946684800000) / cycle) * cycle
      // ECMA-402 §11.5.4 steps 13–15: use surrogate labels and retain the real
      // clock parts.
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
    return restoreCalendarParts(
      value,
      raw,
      epoch!,
      labels,
      options,
      parts,
      rangeFields
    )
  }
  // Whole Gregorian cycles preserve weekday and clock in the plain UTC projection.
  const surrogate =
      value.milliseconds -
      floor((value.milliseconds - 946684800000) / cycle) * cycle,
    raw = parts.call(value.formatter, surrogate)
  if (
    !arraySome(raw, part =>
      arrayIncludes(
        ['year', 'month', 'day', 'era', 'relatedYear', 'yearName'],
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
    // ECMA-262 §21.4.1.3 step 1: floor the UTC projection to its original day.
    floor(value.milliseconds / dayMilliseconds),
    value.formatter,
    options,
    parts,
    rangeFields
  )
}

function restoreCalendarParts(
  value: LegacyDateTimeProjection,
  raw: Intl.DateTimeFormatPart[],
  epoch: number,
  labels: Intl.DateTimeFormat,
  options: Intl.ResolvedDateTimeFormatOptions,
  parts: Parts,
  rangeFields?: CalendarRangeFields
): Intl.DateTimeFormatPart[] {
  const calendar = options.calendar as CalendarId,
    // ECMA-402 §11.5.11 step 5.a: convert the original local day to calendar
    // fields.
    date = calendarFromEpochDayRaw(calendar, epoch),
    era = calendarEra(calendar, epoch, true),
    rawYear = era?.eraYear ?? date.year,
    // ECMA-402 §11.5.4 step 15.f.iv: normalize the nonpositive display year.
    year = rawYear <= 0 ? 1 - rawYear : rawYear,
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
    // ECMA-402 §11.5.4 step 15.f.ix: take the last two Unicode code points.
    short = (value: number): string =>
      Array.from(formatTwo(value)).slice(-2).join(''),
    changes = new Map<string, string>()
  if (arraySome(raw, part => part.type === 'year')) {
    // ECMA-402 §11.5.8 step 15.d.v: keep the year before formatting it.
    if (rangeFields) rangeFields.year = rawYear
    const sampleText = firstPart(controls, 'year'),
      two =
        options.year === '2-digit' ||
        (options.year === undefined &&
          sampleText !== format(sampleYear) &&
          sampleText === short(sampleYear))
    // ECMA-402 §11.5.4 steps 15.f.viii–ix: select numeric or two-digit year
    // text.
    const display = two ? short(year) : format(year)
    changes.set('year', display)
    if (rangeFields && options.year === 'numeric' && era && !clipped(value)) {
      const hostYear = rawYear === year ? display : format(rawYear)
      // A range can use a different year width from the single-date pattern.
      if (
        hostYear === display ||
        short(year) === display ||
        (formatTwo(rawYear) !== hostYear && short(rawYear) !== hostYear)
      )
        rangeFields.numericYear = {
          era: era.era,
          raw: hostYear,
          corrected: display,
          month:
            options.month === 'numeric' || options.month === '2-digit'
              ? [format(date.month), formatTwo(date.month)]
              : undefined,
          textualMonth:
            calendar === 'buddhist' &&
            (options.month === 'narrow' ||
              options.month === 'short' ||
              options.month === 'long')
              ? date.month
              : undefined,
          day: undefined,
          weekday: undefined,
        }
    }
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
  // ECMA-402 §11.5.4 step 15.f.x: reuse the month label from the control
  // partition.
  if (arraySome(raw, part => part.type === 'month'))
    changes.set('month', firstPart(controls, 'month'))
  if (arraySome(raw, part => part.type === 'day')) {
    // ECMA-402 §11.5.4 steps 15.f.viii–ix: preserve the host day width.
    const two = firstPart(controls, 'day') === formatTwo(3)
    const corrected = two ? formatTwo(date.day) : format(date.day)
    changes.set('day', corrected)
    const year = rangeFields?.numericYear
    if (year && (options.day === 'numeric' || options.day === '2-digit')) {
      year.day = {
        raw: undefined,
        corrected: [format(date.day), formatTwo(date.day)],
        single: corrected,
        identify: text => {
          for (let day = 1; day <= 9; day++) {
            const numeric = format(day)
            const padded = formatTwo(day)
            if (text === numeric || text === padded) return [numeric, padded]
          }
          if (text === corrected) return [text, text]
          return undefined
        },
      }
    }
  }
  // ECMA-402 §11.5.4 steps 15.f.ii and 15.f.x: restore the era label at that
  // width.
  if (era && arraySome(raw, part => part.type === 'era'))
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
    arrayEvery(
      raw,
      part => !changes.has(part.type) || changes.get(part.type) === part.value
    )
  )
    return raw
  // ECMA-402 §11.5.7 steps 4.b–c: keep part types and replace corrected values.
  return raw.map(part =>
    changes.has(part.type) ? {...part, value: changes.get(part.type)!} : part
  )
}

// ECMA-402 §11.5.8 step 15.d: check endpoint labels before reusing the host selection.
function matchesNumericRangeYear(
  raw: Intl.DateTimeFormatPart[],
  corrected: Intl.DateTimeFormatPart[],
  year: NumericRangeYear
): boolean {
  return (
    raw.length === corrected.length &&
    arraySome(raw, part => part.type === 'year') &&
    arraySome(raw, part => part.type === 'era') &&
    arrayEvery(raw, ({type, value}, index) => {
      const after = corrected[index]
      if (type !== after.type) return false
      if (type === 'year')
        return value === year.raw && after.value === year.corrected
      if (type === 'day') {
        const day = year.day
        // Check the original endpoint's text. Plain formatting may have used
        // a different year as its surrogate.
        if (!day || after.value !== day.single) return false
        const widths = day.identify(value)
        if (!widths || (day.raw && day.raw[0] !== widths[0])) return false
        day.raw = widths
        return true
      }
      if (value !== after.value) return false
      if (type === 'weekday') {
        if (year.weekday !== undefined && year.weekday !== value) return false
        year.weekday = value
        return true
      }
      if (type === 'month')
        return (
          year.textualMonth !== undefined ||
          (year.month !== undefined && arrayIncludes(year.month, value))
        )
      return type === 'era' || type === 'literal'
    })
  )
}

// ECMA-402 §11.5.8 step 19.e: the selected range pattern sets its own width.
function correctedRangeDay(
  day: NumericRangeDay | undefined,
  value: string
): string | undefined {
  if (!day?.raw) return undefined
  const numeric = day.raw[0]
  const padded = day.raw[1]
  if (value === numeric) {
    if (numeric === padded && day.corrected[0] !== day.corrected[1])
      return undefined
    return day.corrected[0]
  }
  if (value === padded) return day.corrected[1]
  return undefined
}

function restoreNumericRangeYears(
  parts: Intl.DateTimeRangeFormatPart[],
  first: NumericRangeYear,
  last: NumericRangeYear
): Intl.DateTimeRangeFormatPart[] | undefined {
  let start: Intl.DateTimeRangeFormatPart | undefined,
    end: Intl.DateTimeRangeFormatPart | undefined
  let hasDays = false
  for (let index = 0; index < parts.length; index++) {
    const part = parts[index]
    if (part.type === 'era' || part.type === 'literal') continue
    if (part.type === 'weekday') {
      // ECMA-402 §11.5.8 step 19.e: keep a weekday verified at its source.
      if (part.source !== 'endRange' && part.value !== first.weekday)
        return undefined
      if (part.source !== 'startRange' && part.value !== last.weekday)
        return undefined
      continue
    }
    if (part.type === 'month') {
      if (first.textualMonth !== undefined && last.textualMonth !== undefined) {
        // ECMA-402 §11.5.4 step 15.f.x and §11.5.8 step 19.e: keep the
        // selected width and day-field context for the verified month.
        if (
          part.source === 'shared' &&
          first.textualMonth !== last.textualMonth
        )
          return undefined
        continue
      }
      if (
        part.source !== 'endRange' &&
        (!first.month || !arrayIncludes(first.month, part.value))
      )
        return undefined
      if (
        part.source !== 'startRange' &&
        (!last.month || !arrayIncludes(last.month, part.value))
      )
        return undefined
      continue
    }
    if (part.type === 'day') {
      const day = part.source === 'endRange' ? last.day : first.day
      const corrected = correctedRangeDay(day, part.value)
      if (
        corrected === undefined ||
        (part.source === 'shared' &&
          corrected !== correctedRangeDay(last.day, part.value))
      )
        return undefined
      hasDays = true
      continue
    }
    if (part.type !== 'year') return undefined
    if (part.source === 'startRange' && !start && part.value === first.raw)
      start = part
    else if (part.source === 'endRange' && !end && part.value === last.raw)
      end = part
    else return undefined
  }
  if (!start || !end) return undefined
  // ECMA-402 §11.5.8 steps 19.b–f: keep the host pattern and source tags.
  start.value = first.corrected
  end.value = last.corrected
  if (hasDays) {
    for (let index = 0; index < parts.length; index++) {
      const part = parts[index]
      if (part.type === 'day')
        part.value = correctedRangeDay(
          part.source === 'endRange' ? last.day : first.day,
          part.value
        )!
    }
  }
  return parts
}

export function legacyCalendarRangeParts(
  first: LegacyDateTimeProjection,
  last: LegacyDateTimeProjection,
  parts: Parts,
  rangeParts: RangeParts,
  resolved: Resolved
): Intl.DateTimeRangeFormatPart[] | undefined {
  const {calendar, timeZone} = resolved.call(first.formatter)
  if (
    calendar === 'iso8601' ||
    calendar === 'gregory' ||
    !arrayIncludes(calendarIds, calendar as CalendarId)
  )
    return undefined
  // ECMA-402 §11.5.8 steps 7–8 and 19.e: obtain corrected endpoint partitions.
  const firstFields: CalendarRangeFields = {
      year: undefined,
      numericYear: undefined,
    },
    lastFields: CalendarRangeFields = {
      year: undefined,
      numericYear: undefined,
    }
  const start =
      legacyCalendarParts(first, parts, resolved, firstFields) ??
      correctLunisolarParts(
        first,
        parts.call(first.formatter, first.milliseconds),
        resolved
      ),
    end =
      legacyCalendarParts(last, parts, resolved, lastFields) ??
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
        arrayEvery(
          one,
          (part, index) =>
            part.type === two[index].type && part.value === two[index].value
        )
      // ECMA-402 §11.5.10 step 1: keep native partitioning for unchanged
      // endpoints.
      const rawStart = parts.call(first.formatter, first.milliseconds),
        startUnchanged = same(start, rawStart)
      let rawEnd: Intl.DateTimeFormatPart[] | undefined
      if (startUnchanged) {
        rawEnd = parts.call(last.formatter, last.milliseconds)
        if (same(end, rawEnd)) return undefined
      }
      const firstYear = firstFields.numericYear,
        lastYear = lastFields.numericYear
      // ECMA-402 §11.5.8 step 15.d: common era and distinct full years
      // select the same pattern before any month or day difference matters.
      if (
        firstYear &&
        lastYear &&
        firstYear.era === lastYear.era &&
        firstYear.raw !== lastYear.raw &&
        matchesNumericRangeYear(rawStart, start, firstYear) &&
        matchesNumericRangeYear(
          (rawEnd ??= parts.call(last.formatter, last.milliseconds)),
          end,
          lastYear
        ) &&
        (firstYear.textualMonth === undefined ||
          hostBuddhistMonth(timeZone, first.milliseconds) ===
            firstYear.textualMonth) &&
        (lastYear.textualMonth === undefined ||
          hostBuddhistMonth(timeZone, last.milliseconds) ===
            lastYear.textualMonth)
      ) {
        const years = restoreNumericRangeYears(
          rangeParts.call(
            first.formatter,
            first.milliseconds,
            last.milliseconds
          ),
          firstYear,
          lastYear
        )
        if (years) return years
      }
    } catch (error) {
      if (
        !(error instanceof RangeErrorConstructor) &&
        !(error instanceof TypeErrorConstructor)
      )
        throw error
    }
  }
  // ECMA-402 §11.5.8 step 15.d.vi: distinct raw years prevent collapse.
  const allowCollapse =
    firstFields.year === undefined ||
    lastFields.year === undefined ||
    firstFields.year === lastFields.year
  return joinCalendarRangeParts(
    first.formatter,
    start,
    end,
    rangeParts,
    allowCollapse
  )
}
