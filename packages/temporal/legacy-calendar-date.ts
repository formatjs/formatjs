import {
  RangeErrorConstructor,
  TypeErrorConstructor,
  arrayEvery,
  arrayIncludes,
  arraySome,
  floor,
  mathAbs,
  mathTrunc,
  numberIsFinite,
  setDataProperty,
} from '#packages/ecma262-abstract/intrinsics.js'
import {lastTwoCodePoints} from '#packages/ecma402-abstract/DateTimeFormat/FormatDateTimePattern.js'
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
  hostBuddhistDateMatches,
  hostBuddhistMonth,
  legacyISOEpochDay,
  lunisolarUtcRangeDays,
  lunisolarUtcLeapMonthRange,
  type LunisolarRangeEndpoint,
  type LunisolarRangeFields,
} from '#packages/temporal/legacy-lunisolar-date.js'
import type {LegacyDateTimeProjection} from '#packages/temporal/legacy-extended-date.js'
import {createObject} from '#packages/temporal/intrinsics.js'

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

interface CalendarRangeFields extends LunisolarRangeFields {
  year: number | undefined
  narrowMonth: number | undefined
  numericYear: NumericRangeYear | undefined
}

// ECMA-262 §28.1.1 step 4 invokes the captured formatter directly.
// https://tc39.es/ecma262/#sec-reflect.apply
const apply = Reflect.apply
const weakMapGet = WeakMap.prototype.get
const weakMapSet = WeakMap.prototype.set
const stringIndexOf = String.prototype.indexOf
const stringLastIndexOf = String.prototype.lastIndexOf
const stringSlice = String.prototype.slice
const Constructor = globalThis.Intl?.DateTimeFormat
const NumberConstructor = globalThis.Intl?.NumberFormat
const numberFormat =
  NumberConstructor &&
  Object.getOwnPropertyDescriptor(NumberConstructor.prototype, 'format')?.get
const dayMilliseconds = 86400000
const limit = 8640000000000000
const cycle = 146097 * dayMilliseconds
const reference = 1609459200000
const representatives: Record<string, number | undefined> = createObject(null)
type NumberLabels = Record<number, ((value: number) => string) | undefined>
type EraLabels = Record<string, string | undefined>
const numbers = new WeakMap<Intl.DateTimeFormat, NumberLabels>()
const eraWidths = new WeakMap<
  Intl.DateTimeFormat,
  'long' | 'short' | 'narrow'
>()
const eraLabels = new WeakMap<Intl.DateTimeFormat, EraLabels>()
const clockFormatters = new WeakMap<Intl.DateTimeFormat, Intl.DateTimeFormat>()
const clockTypes = [
  'weekday',
  'hour',
  'minute',
  'second',
  'fractionalSecond',
  'dayPeriod',
  'timeZoneName',
]

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
  let cache = apply(weakMapGet, numbers, [source]) as NumberLabels | undefined
  if (!cache) {
    cache = createObject(null) as NumberLabels
    apply(weakMapSet, numbers, [source, cache])
  }
  const existing = cache[digits]
  if (existing) return existing
  if (!NumberConstructor || !numberFormat)
    throw new RangeErrorConstructor(
      'Extended calendar dates require Intl.NumberFormat'
    )
  // ECMA-402 §11.5.4 steps 3–5 and 7–10: reuse localized ungrouped integer
  // digits.
  const result = apply(
    numberFormat,
    new NumberConstructor(options.locale, {
      numberingSystem: options.numberingSystem,
      useGrouping: false,
      minimumIntegerDigits: digits,
      maximumFractionDigits: 0,
    }),
    []
  )
  cache[digits] = result
  return result
}
function representative(
  calendar: CalendarId,
  code: string,
  leap: boolean
): number {
  const key = `${calendar}:${code}:${leap}`
  const cached = representatives[key]
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
    representatives[key] = epoch
    return epoch
  }
  throw new RangeErrorConstructor('No host calendar label example')
}
function findPart(
  parts: Intl.DateTimeFormatPart[],
  type: string
): Intl.DateTimeFormatPart | undefined {
  // ECMA-402 §11.5.7 steps 4.b–c: read the host part with the requested type.
  for (let index = 0; index < parts.length; index++)
    if (parts[index].type === type) return parts[index]
}
function firstPart(parts: Intl.DateTimeFormatPart[], type: string): string {
  const part = findPart(parts, type)
  if (!part)
    throw new RangeErrorConstructor(
      `Unsupported host calendar pattern: ${type}`
    )
  return part.value
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
  const existing = apply(weakMapGet, eraWidths, [source]) as
    | 'long'
    | 'short'
    | 'narrow'
    | undefined
  if (existing) return existing
  // ECMA-402 §11.5.4 step 15.f.ii: prefer the resolved era width.
  if (
    options.era === 'long' ||
    options.era === 'short' ||
    options.era === 'narrow'
  ) {
    apply(weakMapSet, eraWidths, [source, options.era])
    return options.era
  }
  // ECMA-402 §11.5.4 step 15.f.x: infer style-selected era width from host
  // labels.
  const original = firstPart(raw, 'era')
  const widths = ['long', 'short', 'narrow'] as const
  for (let index = 0; index < widths.length; index++) {
    const width = widths[index]
    const formatter = new Constructor!(
      options.locale,
      eraOptions(options, options.calendar, width)
    )
    if (firstPart(apply(parts, formatter, [surrogate]), 'era') === original) {
      apply(weakMapSet, eraWidths, [source, width])
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
  let cache = apply(weakMapGet, eraLabels, [source]) as EraLabels | undefined
  if (!cache) {
    cache = createObject(null) as EraLabels
    apply(weakMapSet, eraLabels, [source, cache])
  }
  const key = `${calendar}:${era}:${width}`,
    existing = cache[key]
  if (existing !== undefined) return existing
  // ECMA-402 §11.5.4 step 15.f.x: supply the before-Hijrah label from locale
  // data.
  if (era === 'bh') {
    const extension = apply(stringIndexOf, options.locale, ['-u-'])
    let locale =
      extension < 0
        ? options.locale
        : apply(stringSlice, options.locale, [0, extension])
    for (
      let index = apply(stringLastIndexOf, locale, ['-']);
      !beforeHijrah[locale] && index >= 0;
      index = apply(stringLastIndexOf, locale, ['-'])
    )
      locale = apply(stringSlice, locale, [0, index])
    const value = (beforeHijrah[locale] ?? beforeHijrah.en)[
      width === 'long' ? 0 : width === 'short' ? 1 : 2
    ]
    cache[key] = value
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
    apply(parts, formatter, [sample * dayMilliseconds]),
    'era'
  )
  cache[key] = value
  return value
}

export function legacyCalendarParts(
  value: LegacyDateTimeProjection,
  parts: Parts,
  resolved: Resolved,
  rangeFields?: CalendarRangeFields
): Intl.DateTimeFormatPart[] | undefined {
  // ECMA-402 §11.5.4 step 12: select the calendar for date-field restoration.
  const options = apply(resolved, value.formatter, []),
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
      raw = apply(parts, value.formatter, [value.milliseconds])
      if (
        !arraySome(
          raw,
          // ECMA-402 §11.5.7 step 4.b: inspect host-emitted date part types.
          part =>
            arrayIncludes(
              ['year', 'month', 'day', 'era', 'relatedYear', 'yearName'],
              part.type
            )
        )
      )
        return raw
      if (lunar)
        return correctLunisolarParts(
          value,
          raw,
          resolved,
          undefined,
          undefined,
          rangeFields
        )
      labels = calendarLabelFormatter(value.formatter, options, raw)
    } catch (error) {
      if (
        !(error instanceof RangeErrorConstructor) &&
        !(error instanceof TypeErrorConstructor)
      )
        throw error
      epoch ??= legacyISOEpochDay(options.timeZone, value.milliseconds)
      // Some host calendars fail at valid Date bounds; retain their clock and zone via Gregorian fields.
      let clock = apply(weakMapGet, clockFormatters, [value.formatter]) as
        | Intl.DateTimeFormat
        | undefined
      if (!clock) {
        clock = new Constructor!(options.locale, {
          ...options,
          calendar: 'gregory',
        } as Intl.DateTimeFormatOptions)
        apply(weakMapSet, clockFormatters, [value.formatter, clock])
      }
      // ECMA-402 §11.5.4 steps 12 and 15.c–g: take clock and zone parts from
      // the real instant.
      const clockParts = apply(parts, clock, [value.milliseconds])
      labels = calendarLabelFormatter(
        value.formatter,
        options,
        lunar ? apply(parts, value.formatter, [reference]) : clockParts
      )
      const local = epoch * dayMilliseconds
      surrogate = local - floor((local - 946684800000) / cycle) * cycle
      // ECMA-402 §11.5.4 steps 13–15: use surrogate labels and retain the real
      // clock parts.
      raw = apply(parts, labels, [surrogate])
      // ECMA-402 §11.5.7 steps 4.b–c: restore real clock values by type.
      for (let index = 0; index < raw.length; index++) {
        const type = raw[index].type
        if (!arrayIncludes(clockTypes, type)) continue
        const clockPart = findPart(clockParts, type)
        if (clockPart) raw[index] = clockPart
      }
    }
    // Keep the original local day when labels use a UTC surrogate.
    if (lunar)
      return correctLunisolarParts(
        {...value, formatter: labels},
        raw,
        resolved,
        surrogate,
        epoch,
        rangeFields
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
    raw = apply(parts, value.formatter, [surrogate])
  if (
    !arraySome(
      raw,
      // ECMA-402 §11.5.7 step 4.b: inspect surrogate date part types.
      part =>
        arrayIncludes(
          ['year', 'month', 'day', 'era', 'relatedYear', 'yearName'],
          part.type
        )
    )
  )
    return raw
  if (calendar === 'chinese' || calendar === 'dangi')
    return correctLunisolarParts(
      value,
      raw,
      resolved,
      surrogate,
      undefined,
      rangeFields
    )
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
    controls = apply(parts, labels, [sample * dayMilliseconds]),
    sampleEra = calendarEra(calendar, sample, true),
    sampleYear =
      sampleEra?.eraYear ?? calendarFromEpochDayRaw(calendar, sample).year,
    format = number(value.formatter, options, 1),
    formatTwo = number(value.formatter, options, 2),
    // ECMA-402 §11.5.4 step 15.f.ix: take the last two Unicode code points.
    short = (value: number): string => lastTwoCodePoints(formatTwo(value))
  const changes: Record<string, string | undefined> = createObject(null)
  if (
    arraySome(
      raw,
      // ECMA-402 §11.5.7 step 4.b: restore text only for an emitted year part.
      part => part.type === 'year'
    )
  ) {
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
    changes.year = display
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
      changes.year = firstPart(
        apply(parts, value.formatter, [value.milliseconds]),
        'year'
      )
  }
  // ECMA-402 §11.5.4 step 15.f.x: reuse the month label from the control
  // partition.
  if (arraySome(raw, part => part.type === 'month')) {
    changes.month = firstPart(controls, 'month')
    if (rangeFields && calendar === 'buddhist' && options.month === 'narrow')
      rangeFields.narrowMonth = date.month
  }
  if (
    arraySome(
      raw,
      // ECMA-402 §11.5.7 step 4.b: restore text only for an emitted day part.
      part => part.type === 'day'
    )
  ) {
    // ECMA-402 §11.5.4 steps 15.f.viii–ix: preserve the host day width.
    const two = firstPart(controls, 'day') === formatTwo(3)
    const corrected = two ? formatTwo(date.day) : format(date.day)
    changes.day = corrected
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
    changes.era = eraLabel(
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
  if (
    arrayEvery(
      raw,
      // ECMA-402 §11.5.7 steps 4.b–c: compare corrected and emitted part values.
      part =>
        changes[part.type] === undefined || changes[part.type] === part.value
    )
  )
    return raw
  // ECMA-402 §11.5.7 steps 4.b–e create parts with their corrected labels.
  // https://tc39.es/ecma402/#sec-formatdatetimetoparts
  const result: Intl.DateTimeFormatPart[] = []
  for (let index = 0; index < raw.length; index++) {
    const part = raw[index]
    const value = changes[part.type]
    setDataProperty(
      result,
      index,
      value === undefined ? part : {...part, value}
    )
  }
  return result
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
  day: Pick<NumericRangeDay, 'raw' | 'corrected'> | undefined,
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
    else if (
      part.source === 'shared' &&
      !start &&
      !end &&
      part.value === first.raw &&
      part.value === last.raw &&
      first.corrected === last.corrected
    )
      start = end = part
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

function restoreLunisolarRangeDays(
  first: LegacyDateTimeProjection,
  last: LegacyDateTimeProjection,
  calendar: 'chinese' | 'dangi',
  options: Intl.ResolvedDateTimeFormatOptions,
  rangeParts: RangeParts,
  endpoints: [first: LunisolarRangeEndpoint, last: LunisolarRangeEndpoint],
  labels: [start: Intl.DateTimeFormatPart[], end: Intl.DateTimeFormatPart[]]
): Intl.DateTimeRangeFormatPart[] | undefined {
  if (
    options.timeZone !== 'UTC' ||
    (options.day !== 'numeric' && options.day !== '2-digit')
  )
    return undefined
  const days = lunisolarUtcRangeDays(
    calendar,
    first,
    last,
    endpoints[0],
    endpoints[1]
  )
  if (!days) return undefined
  const format = number(first.formatter, options, 1)
  const formatTwo = number(first.formatter, options, 2)
  const widths = (day: number): NumericWidths => [format(day), formatTwo(day)]
  const firstDay = {raw: widths(days[0][0]), corrected: widths(days[0][1])}
  const lastDay = {raw: widths(days[1][0]), corrected: widths(days[1][1])}
  const parts = apply(rangeParts, first.formatter, [
    first.milliseconds,
    last.milliseconds,
  ])
  let start: {part: Intl.DateTimeRangeFormatPart; value: string} | undefined
  let end: {part: Intl.DateTimeRangeFormatPart; value: string} | undefined
  for (let index = 0; index < parts.length; index++) {
    const part = parts[index]
    const type: string = part.type
    if (type === 'month' || type === 'literal') continue
    if (type === 'relatedYear' || type === 'yearName') {
      // ECMA-402 §11.5.4 steps 15.h–i and §11.5.8 steps 19.c–e: keep
      // native year labels only when the corresponding endpoint agrees.
      const matches = (label: Intl.DateTimeFormatPart): boolean =>
        (label.type as string) === type && label.value === part.value
      if (
        (part.source !== 'endRange' && !arraySome(labels[0], matches)) ||
        (part.source !== 'startRange' && !arraySome(labels[1], matches))
      )
        return undefined
      continue
    }
    if (type !== 'day' || part.source === 'shared') return undefined
    const isStart = part.source === 'startRange'
    if (isStart ? start : end) return undefined
    const value = correctedRangeDay(isStart ? firstDay : lastDay, part.value)
    if (value === undefined) return undefined
    if (isStart) start = {part, value}
    else end = {part, value}
  }
  if (!start || !end) return undefined
  // ECMA-402 §11.5.8 steps 19.e–f: retain the selected pattern and
  // format the corrected Day at the verified width.
  start.part.value = start.value
  end.part.value = end.value
  return parts
}

function projectedBuddhistRange(
  first: LegacyDateTimeProjection,
  last: LegacyDateTimeProjection,
  options: Intl.ResolvedDateTimeFormatOptions,
  rangeParts: RangeParts
): Intl.DateTimeRangeFormatPart[] | undefined {
  // ECMA-262 §21.4.1.31 step 3: use integer milliseconds for the projection.
  const start = mathTrunc(first.milliseconds)
  const end = mathTrunc(last.milliseconds)
  const cycles = floor((start - reference) / cycle)
  if (!cycles) return undefined
  const projectedStart = start - cycles * cycle
  const projectedEnd = end - cycles * cycle
  if (projectedEnd < reference || projectedEnd > limit) return undefined
  const firstDate = calendarFromEpochDayRaw(
    'buddhist',
    floor(start / dayMilliseconds)
  )
  const lastDate = calendarFromEpochDayRaw(
    'buddhist',
    floor(end / dayMilliseconds)
  )
  const shift = cycles * 400
  const firstYear = firstDate.year - shift
  const lastYear = lastDate.year - shift
  if (
    !hostBuddhistDateMatches(
      projectedStart,
      firstYear,
      firstDate.month,
      firstDate.day
    ) ||
    !hostBuddhistDateMatches(
      projectedEnd,
      lastYear,
      lastDate.month,
      lastDate.day
    )
  )
    return undefined

  // ECMA-402 §11.5.8 steps 7–8, 15.d and 19.e: a common cycle preserves
  // the compared date fields. Keep the host pattern, including added fields.
  const result = apply(rangeParts, first.formatter, [
    projectedStart,
    projectedEnd,
  ])
  const numeric = number(first.formatter, options, 1)
  const padded = number(first.formatter, options, 2)
  for (let index = 0; index < result.length; index++) {
    const part = result[index]
    if (part.type !== 'year') continue
    const isEnd = part.source === 'endRange'
    const projected = isEnd ? lastYear : firstYear
    const year = isEnd ? lastDate.year : firstDate.year
    if (part.source === 'shared' && firstDate.year !== lastDate.year)
      return undefined
    // ECMA-402 §11.5.4 steps 15.f.iv and 15.f.viii–ix: normalize the
    // original year at the selected pattern's width.
    const display = year <= 0 ? 1 - year : year
    if (part.value === numeric(projected)) part.value = numeric(display)
    else if (part.value === padded(projected % 100))
      part.value = padded(display % 100)
    else return undefined
  }
  return result
}

export function legacyCalendarRangeParts(
  first: LegacyDateTimeProjection,
  last: LegacyDateTimeProjection,
  parts: Parts,
  rangeParts: RangeParts,
  resolved: Resolved
): Intl.DateTimeRangeFormatPart[] | undefined {
  const options = apply(resolved, first.formatter, [])
  const {calendar, timeZone} = options
  if (
    calendar === 'iso8601' ||
    calendar === 'gregory' ||
    !arrayIncludes(calendarIds, calendar as CalendarId)
  )
    return undefined
  // ECMA-402 §11.5.8 steps 7–8 and 19.e: obtain corrected endpoint partitions.
  const firstFields: CalendarRangeFields = {
      year: undefined,
      narrowMonth: undefined,
      numericYear: undefined,
      lunar: undefined,
    },
    lastFields: CalendarRangeFields = {
      year: undefined,
      narrowMonth: undefined,
      numericYear: undefined,
      lunar: undefined,
    }
  const start =
      legacyCalendarParts(first, parts, resolved, firstFields) ??
      correctLunisolarParts(
        first,
        apply(parts, first.formatter, [first.milliseconds]),
        resolved,
        undefined,
        undefined,
        firstFields
      ),
    end =
      legacyCalendarParts(last, parts, resolved, lastFields) ??
      correctLunisolarParts(
        last,
        apply(parts, last.formatter, [last.milliseconds]),
        resolved,
        undefined,
        undefined,
        lastFields
      )
  const lunarStart = firstFields.lunar
  const lunarEnd = lastFields.lunar
  const firstCode = lunarStart?.expected.monthCode
  const lastCode = lunarEnd?.expected.monthCode
  // ECMA-402 §11.5.8 step 15.d.v: the same month number can identify
  // two distinct ordinal months in a regular/leap pair.
  const regularLeap =
    timeZone === 'UTC' &&
    lunarStart?.expected.year === lunarEnd?.expected.year &&
    firstCode !== undefined &&
    lastCode !== undefined &&
    firstCode !== lastCode &&
    firstCode[1] === lastCode[1] &&
    firstCode[2] === lastCode[2] &&
    arraySome(start, part => part.type === 'month' || part.type === 'day')
  if (!clipped(first) && !clipped(last)) {
    try {
      // ECMA-402 §11.5.7 steps 4.b–c: compare host part records before reuse.
      const same = (
        one: Intl.DateTimeFormatPart[],
        two: Intl.DateTimeFormatPart[]
      ): boolean =>
        one.length === two.length &&
        arrayEvery(
          one,
          // ECMA-402 §11.5.7 steps 4.b–c: compare the emitted type and value.
          (part, index) =>
            part.type === two[index].type && part.value === two[index].value
        )
      // ECMA-402 §11.5.10 step 1: keep native partitioning for unchanged
      // endpoints.
      const rawStart = apply(parts, first.formatter, [first.milliseconds]),
        startUnchanged = same(start, rawStart)
      let rawEnd: Intl.DateTimeFormatPart[] | undefined
      let endUnchanged = false
      if (startUnchanged) {
        rawEnd = apply(parts, last.formatter, [last.milliseconds])
        endUnchanged = same(end, rawEnd)
        // ECMA-402 §11.5.8 step 15.d.v: identical narrow labels do not
        // establish equality of the native and corrected month fields.
        if (
          endUnchanged &&
          (firstFields.narrowMonth === undefined ||
            hostBuddhistMonth(timeZone, first.milliseconds) ===
              firstFields.narrowMonth) &&
          (lastFields.narrowMonth === undefined ||
            hostBuddhistMonth(timeZone, last.milliseconds) ===
              lastFields.narrowMonth)
        ) {
          if (!regularLeap) return undefined
          const raw = apply(rangeParts, first.formatter, [
            first.milliseconds,
            last.milliseconds,
          ])
          if (
            !arraySome(
              raw,
              part => part.type === 'month' && part.source === 'shared'
            ) &&
            arraySome(
              raw,
              part => part.type === 'month' && part.source === 'startRange'
            ) &&
            arraySome(
              raw,
              part => part.type === 'month' && part.source === 'endRange'
            )
          )
            return raw
        }
      }
      if (
        calendar === 'buddhist' &&
        timeZone === 'UTC' &&
        (options.day !== undefined || options.year === '2-digit')
      ) {
        const shortYear = options.year === '2-digit'
        const supportedPart = ({type}: Intl.DateTimeFormatPart): boolean =>
          type === 'literal' ||
          (shortYear ? type === 'year' || type === 'era' : type === 'day')
        // ECMA-402 §11.5.8 step 15.d.v: compare the full projected year,
        // even when distinct years produce the same two-digit text.
        if (
          arrayEvery(start, supportedPart) &&
          arrayEvery(end, supportedPart)
        ) {
          const projected = projectedBuddhistRange(
            first,
            last,
            options,
            rangeParts
          )
          if (projected) return projected
        }
      }
      if (
        (calendar === 'chinese' || calendar === 'dangi') &&
        lunarStart &&
        lunarEnd
      ) {
        const lunar = regularLeap
          ? endUnchanged &&
            lunisolarUtcLeapMonthRange(
              calendar,
              first,
              last,
              lunarStart,
              lunarEnd,
              rangeParts,
              arraySome(start, part => part.type === 'month')
            )
          : restoreLunisolarRangeDays(
              first,
              last,
              calendar,
              options,
              rangeParts,
              [lunarStart, lunarEnd],
              [start, end]
            )
        if (lunar) return lunar
      }
      const firstYear = firstFields.numericYear,
        lastYear = lastFields.numericYear
      // ECMA-402 §11.5.8 steps 15.d.v–vi: a verified common era lets Year
      // differences or distinct verified months select the host pattern.
      if (
        firstYear &&
        lastYear &&
        firstYear.era === lastYear.era &&
        (firstYear.raw !== lastYear.raw ||
          (firstYear.textualMonth !== undefined &&
            lastYear.textualMonth !== undefined &&
            firstYear.textualMonth !== lastYear.textualMonth)) &&
        matchesNumericRangeYear(rawStart, start, firstYear) &&
        matchesNumericRangeYear(
          (rawEnd ??= apply(parts, last.formatter, [last.milliseconds])),
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
          apply(rangeParts, first.formatter, [
            first.milliseconds,
            last.milliseconds,
          ]),
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
  // ECMA-402 §11.5.8 step 15.d.vi: distinct calendar fields prevent collapse.
  const allowCollapse =
    !regularLeap &&
    (firstFields.year === undefined ||
      lastFields.year === undefined ||
      firstFields.year === lastFields.year) &&
    (firstFields.narrowMonth === undefined ||
      lastFields.narrowMonth === undefined ||
      firstFields.narrowMonth === lastFields.narrowMonth)
  return joinCalendarRangeParts(
    first.formatter,
    start,
    end,
    rangeParts,
    allowCollapse
  )
}
