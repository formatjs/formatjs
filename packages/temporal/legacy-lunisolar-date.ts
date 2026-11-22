import {
  RangeErrorConstructor,
  arrayEvery,
  arrayIncludes,
  arraySome,
  floor,
  mathTrunc,
  numberFrom,
  numberIsInteger,
  numberIsSafeInteger,
} from '#packages/ecma262-abstract/intrinsics.js'
import {
  calendarFromEpochDayRaw,
  calendarToEpochDayRaw,
  monthsInYear,
  type CalendarDate,
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
const stableRangeFields = [
  'day',
  'year',
  'relatedYear',
  'yearName',
  'hour',
  'minute',
  'second',
  'fractionalSecond',
  'dayPeriod',
  'timeZoneName',
  'literal',
]
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
  // ECMA-262 §21.4.1.28 steps 8–9: derive the epoch day from valid civil
  // fields.
  return calendarToEpochDayRaw('iso8601', {year, month, day}, 'reject')
}
function probe(
  calendar: Calendar | 'buddhist' | 'iso8601',
  timeZone: string
): Intl.DateTimeFormat {
  const key = `${calendar}:${timeZone}`
  let result = probes.get(key)
  if (!result) {
    // ECMA-402 §11.5.11 steps 3–5: ask Intl for local calendar fields.
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
export function hostBuddhistMonth(
  timeZone: string,
  milliseconds: number
): number | undefined {
  // ECMA-402 §11.5.4 steps 12 and 15.f.iii, v and viii: read the raw ordinal
  // independently of the original formatter's localized month label.
  const parts = nativeParts!.call(probe('buddhist', timeZone), milliseconds)
  for (let index = 0; index < parts.length; index++) {
    const {type, value} = parts[index]
    if (type !== 'month') continue
    const month = numberFrom(value)
    if (!numberIsInteger(month) || month < 1 || month > 12) return undefined
    if (value === `${month}` || (month < 10 && value === `0${month}`))
      return month
    return undefined
  }
  return undefined
}

export function hostBuddhistDateMatches(
  milliseconds: number,
  year: number,
  month: number,
  day: number
): boolean {
  // ECMA-402 §11.5.11 steps 3 and 5.a: verify the host's projected date.
  const parts = nativeParts!.call(probe('buddhist', 'UTC'), milliseconds)
  let readYear: number | undefined
  let readMonth: number | undefined
  let readDay: number | undefined
  for (let index = 0; index < parts.length; index++) {
    const {type, value} = parts[index]
    if (type === 'year') readYear = numberFrom(value)
    else if (type === 'month') readMonth = numberFrom(value)
    else if (type === 'day') readDay = numberFrom(value)
  }
  return readYear === year && readMonth === month && readDay === day
}

function fields(
  calendar: Calendar | 'iso8601',
  timeZone: string,
  milliseconds: number
): {year: number; month: number; day: number; monthCode: string} {
  const formatter = probe(calendar, timeZone)
  const values = new Map<string, string>(
    nativeParts!.call(formatter, milliseconds).map(
      // ECMA-402 §11.5.7 steps 4.b–c: read the emitted type and value.
      part => [part.type, part.value]
    )
  )
  // ECMA-402 §11.5.4 steps 15.f.iii and 15.h.i: recover year and related year.
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
    throw new RangeErrorConstructor('Unsupported host calendar fields')
  // ECMA-402 §11.5.12 Table 17: recover signed Gregorian year using the era.
  let bce = false
  if (calendar === 'iso8601') {
    let positive = positiveEras.get(formatter)
    if (positive === undefined) {
      positive = nativeParts!.call(formatter, 0).find(
        // ECMA-402 §11.5.7 step 4.b: find the era type on the host control.
        part => part.type === 'era'
      )?.value
      if (!positive)
        throw new RangeErrorConstructor('Unsupported host Gregorian era')
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
export interface LunisolarRangeEndpoint {
  expected: CalendarDate
  original: ReturnType<typeof fields> | undefined
}
export interface LunisolarRangeFields {
  lunar: LunisolarRangeEndpoint | undefined
}

type RangeDayPair = [raw: number, corrected: number]

export function lunisolarUtcRangeDays(
  calendar: Calendar,
  first: LegacyDateTimeProjection,
  last: LegacyDateTimeProjection,
  left: LunisolarRangeEndpoint,
  right: LunisolarRangeEndpoint
): [RangeDayPair, RangeDayPair] | undefined {
  const start = left.expected
  const end = right.expected
  const rawStart = left.original ?? fields(calendar, 'UTC', first.milliseconds)
  const rawEnd = right.original ?? fields(calendar, 'UTC', last.milliseconds)
  if (
    rawStart.year !== start.year ||
    rawEnd.year !== end.year ||
    rawStart.monthCode !== start.monthCode ||
    rawEnd.monthCode !== end.monthCode
  )
    return undefined
  // ECMA-402 §11.5.8 steps 15.d.v–vi: verify the first difference at
  // Year, Month or Day. Equal numbered regular and leap months use fallback.
  if (
    start.year === end.year &&
    (start.monthCode === end.monthCode
      ? start.day === end.day || rawStart.day === rawEnd.day
      : rawStart.month === rawEnd.month)
  )
    return undefined
  return [
    [rawStart.day, start.day],
    [rawEnd.day, end.day],
  ]
}

export function lunisolarUtcLeapMonthRange(
  calendar: Calendar,
  first: LegacyDateTimeProjection,
  last: LegacyDateTimeProjection,
  left: LunisolarRangeEndpoint,
  right: LunisolarRangeEndpoint,
  rangeParts: RangeParts,
  displaysMonth: boolean
): Intl.DateTimeRangeFormatPart[] | undefined {
  const sample = (
    projection: LegacyDateTimeProjection,
    {expected, original}: LunisolarRangeEndpoint,
    direction: -1 | 1
  ): number | undefined => {
    const {year, monthCode, day} = expected
    const actual = original ?? fields(calendar, 'UTC', projection.milliseconds)
    if (
      actual.year !== year ||
      actual.monthCode !== monthCode ||
      actual.day !== day
    )
      return undefined
    // ECMA-262 §21.4.1.31 step 3 and §21.4.1.4 step 1: carry the clipped
    // UTC clock into each representative, including dates before the epoch.
    const time = mathTrunc(projection.milliseconds)
    const clock = time - floor(time / dayMilliseconds) * dayMilliseconds
    const monthCount = monthsInYear(calendar, year)
    for (
      let month = expected.month + direction;
      month >= 1 && month <= monthCount;
      month += direction
    ) {
      const epochDay = calendarToEpochDayRaw(
        calendar,
        {year, month, day},
        'constrain'
      )
      const candidate = calendarFromEpochDayRaw(calendar, epochDay)
      if (
        candidate.month !== month ||
        candidate.year !== year ||
        candidate.day !== day
      )
        continue
      const milliseconds = epochDay * dayMilliseconds + clock
      const host = fields(calendar, 'UTC', milliseconds)
      if (
        host.year === year &&
        host.monthCode === candidate.monthCode &&
        host.month !== actual.month &&
        host.day === day
      )
        return milliseconds
    }
    return undefined
  }

  // ECMA-402 §11.5.8 steps 15.d.v–vi: use same-year ordinal months with
  // matching day fields to select the Month pattern for each actual endpoint.
  // Steps 19.c–d assign sources by argument position, even for reverse controls.
  const startSample = sample(first, left, -1) ?? sample(first, left, 1)
  const endSample = sample(last, right, 1) ?? sample(last, right, -1)
  if (startSample === undefined || endSample === undefined) return undefined
  const starts = rangeParts.call(first.formatter, first.milliseconds, endSample)
  const ends = rangeParts.call(first.formatter, startSample, last.milliseconds)
  // ECMA-402 §11.5.8 steps 19.c–f: keep the weekday of each tagged endpoint.
  // Both controls must agree on the other date and clock fields and literals.
  // If the base displays Month, require its label at both endpoints.
  if (
    starts.length !== ends.length ||
    !arrayEvery(starts, (part, index) => {
      const other = ends[index]
      if (part.type !== other.type || part.source !== other.source) return false
      if (part.type === 'month') return part.source !== 'shared'
      if (part.type === 'weekday')
        return part.source !== 'shared' || part.value === other.value
      return (
        arrayIncludes(stableRangeFields, part.type) &&
        part.value === other.value
      )
    }) ||
    !arraySome(
      starts,
      part =>
        part.source === 'startRange' &&
        (!displaysMonth || part.type === 'month')
    ) ||
    !arraySome(
      starts,
      part =>
        part.source === 'endRange' && (!displaysMonth || part.type === 'month')
    )
  )
    return undefined
  for (let index = 0; index < starts.length; index++) {
    if (starts[index].source === 'endRange') starts[index] = ends[index]
  }
  return starts
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
    // ECMA-402 §11.5.11 step 5.a: catalog host month codes by local month
    // start.
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
    // ECMA-402 §11.5.4 step 15.f.x: keep label options on a UTC sample
    // formatter.
    const projected = {
      ...options,
      timeZone: 'UTC',
    } as Intl.DateTimeFormatOptions
    // Some hosts omit resolved year options for relatedYear/yearName output.
    if (
      !options.dateStyle &&
      !options.year &&
      arraySome(
        raw,
        // ECMA-402 §11.5.4 steps 15.h.iii and 15.i.iii: detect emitted lunar year types.
        part => arrayIncludes(['relatedYear', 'yearName'], part.type)
      )
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
  // ECMA-402 §11.5.11 steps 3–4: recover the instant's local Gregorian day.
  const value = fields('iso8601', timeZone, milliseconds)
  return isoDay(value.year, value.month, value.day)
}
function part(
  source: Intl.DateTimeFormat,
  epoch: number,
  type: string
): string {
  // ECMA-402 §11.5.7 step 1: get the requested label from a native partition.
  const value = nativeParts!.call(source, epoch * dayMilliseconds).find(
    // ECMA-402 §11.5.7 step 4.b: select the emitted type.
    part => part.type === type
  )
  if (!value)
    throw new RangeErrorConstructor(
      `Unsupported host calendar pattern: ${type}`
    )
  return value.value
}
function monthLabel(
  source: Intl.DateTimeFormat,
  calendar: Calendar,
  code: string
): string {
  // ECMA-402 §11.5.4 step 15.f.x: sample the month label or reconstruct its
  // leap form.
  const data = catalog(calendar, code),
    epoch = data.months.get(code)
  if (epoch !== undefined) return part(source, epoch + 14, 'month')
  if (!code.endsWith('L') || !data.leap)
    throw new RangeErrorConstructor('Unsupported host calendar month')
  const normal = monthLabel(source, calendar, data.leap.slice(0, -1)),
    leap = part(source, data.months.get(data.leap)! + 14, 'month'),
    index = leap.indexOf(normal)
  if (index < 0)
    throw new RangeErrorConstructor('Unsupported host leap-month pattern')
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
  expectedEpochDay?: number,
  rangeFields?: LunisolarRangeFields
): Intl.DateTimeFormatPart[] {
  const options = resolved.call(value.formatter),
    calendar = options.calendar
  if (
    (calendar !== 'chinese' && calendar !== 'dangi') ||
    !arraySome(
      raw,
      // ECMA-402 §11.5.7 step 4.b: check host part types before correction.
      part => dateTypes.has(part.type)
    )
  )
    return raw
  const iso =
      surrogateMilliseconds === undefined && expectedEpochDay === undefined
        ? fields('iso8601', options.timeZone, value.milliseconds)
        : undefined,
    // ECMA-402 §11.5.11 step 5.a: compute fields from the original local day.
    expected = calendarFromEpochDayRaw(
      calendar,
      expectedEpochDay ??
        (iso
          ? isoDay(iso.year, iso.month, iso.day)
          : floor(value.milliseconds / dayMilliseconds))
    ),
    // ECMA-402 §11.5.4 step 12: recover the fields used by the native
    // partition.
    actual = fields(
      calendar,
      options.timeZone,
      surrogateMilliseconds ?? value.milliseconds
    )
  if (rangeFields)
    rangeFields.lunar = {
      expected,
      original: surrogateMilliseconds === undefined ? actual : undefined,
    }
  if (
    actual.year === expected.year &&
    actual.monthCode === expected.monthCode &&
    actual.day === expected.day
  )
    return raw
  const labels = calendarLabelFormatter(value.formatter, options, raw),
    changes = new Map<string, string>()
  if (
    actual.day !== expected.day &&
    arraySome(
      raw,
      // ECMA-402 §11.5.7 step 4.b: restore only an emitted day part.
      part => part.type === 'day'
    )
  ) {
    // ECMA-402 §11.5.4 steps 15.f.iii and 15.f.viii: restore the day from a
    // control.
    const data = catalog(calendar, 'M01')
    changes.set('day', part(labels, data.full! + expected.day - 1, 'day'))
  }
  if (
    actual.monthCode !== expected.monthCode &&
    arraySome(
      raw,
      // ECMA-402 §11.5.7 step 4.b: restore only an emitted month part.
      part => part.type === 'month'
    )
  )
    // ECMA-402 §11.5.4 step 15.f.x: restore the month label for the true month
    // code.
    changes.set('month', monthLabel(labels, calendar, expected.monthCode))
  if (actual.year !== expected.year) {
    const cycleYear = 2000 + ((((expected.year - 2000) % 60) + 60) % 60)
    for (const item of raw) {
      const type: string = item.type
      // ECMA-402 §11.5.4 steps 15.i.i–iii: select the localized cyclical year
      // label.
      if (type === 'yearName')
        changes.set(item.type, part(labels, isoDay(cycleYear, 7, 1), item.type))
      // ECMA-402 §11.5.4 steps 15.f.viii–ix and 15.h: correct numeric year
      // text.
      else if (type === 'year' || type === 'relatedYear') {
        if (!NumberConstructor || !numberFormat)
          throw new RangeErrorConstructor(
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
    ? raw.map(
        // ECMA-402 §11.5.7 steps 4.b–c: keep the type and restore the text.
        item =>
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
  // ECMA-402 §11.5.10 step 1: retain native range partition when fields agree.
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
  parts: RangeParts,
  allowCollapse = true
): Intl.DateTimeRangeFormatPart[] {
  if (
    allowCollapse &&
    start
      .map(
        // ECMA-402 §11.5.6 step 3.a: compose start text for the fallback check.
        part => part.value
      )
      .join('') ===
      end
        .map(
          // ECMA-402 §11.5.6 step 3.a: compose end text for the fallback check.
          part => part.value
        )
        .join('')
  )
    // ECMA-402 §11.5.8 step 16.c: tag the collapsed fallback parts as shared.
    return start.map(part => ({...part, source: 'shared'}))
  let separator = separators.get(formatter)
  if (separator === undefined) {
    // ECMA-402 §11.5.8 steps 18–19: sample a separator for the compatibility
    // fallback.
    const sample = parts.call(formatter, 946718033000, 1025966286000),
      end = sample.findIndex(
        // ECMA-402 §11.5.10 step 4.d: read the host sample's endpoint tag.
        part => part.source === 'endRange'
      )
    let start = end - 1
    while (start >= 0 && sample[start].source !== 'startRange') start--
    if (start < 0 || end < 0)
      throw new RangeErrorConstructor('Unsupported host calendar range pattern')
    separator = sample
      .slice(start + 1, end)
      .map(
        // ECMA-402 §11.5.10 step 4.c: read the host sample's separator text.
        part => part.value
      )
      .join('')
    separators.set(formatter, separator)
  }
  // ECMA-402 §11.5.8 step 19.f.i: carry source labels into the fallback parts.
  return [
    ...start.map(
      // ECMA-402 §11.5.10 steps 4.b–d: preserve start parts and tag their source.
      part => ({...part, source: 'startRange' as const})
    ),
    {type: 'literal', value: separator, source: 'shared'},
    ...end.map(
      // ECMA-402 §11.5.10 steps 4.b–d: preserve end parts and tag their source.
      part => ({...part, source: 'endRange' as const})
    ),
  ]
}
