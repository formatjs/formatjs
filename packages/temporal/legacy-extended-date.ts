import {
  RangeErrorConstructor,
  arrayIncludes,
  mathAbs,
  setDataProperty,
} from '#packages/ecma262-abstract/intrinsics.js'
import {YearFromTime} from '#packages/ecma262-abstract/DateOperations.js'
import type {TemporalDateTimeValue} from '#packages/ecma402-abstract/DateTimeFormat/TemporalDateTime.js'
import {calendarIds, type CalendarId} from '#packages/temporal/calendar.js'
import {
  legacyCalendarParts,
  legacyCalendarRangeParts,
} from '#packages/temporal/legacy-calendar-date.js'
import {
  correctLunisolarParts,
  joinCalendarRangeParts,
  lunisolarRangeParts,
} from '#packages/temporal/legacy-lunisolar-date.js'

export const legacyTimeZoneName: unique symbol = Symbol()
export const legacyHostDateBoundary: unique symbol = Symbol()

export interface LegacyDateTimeProjection {
  formatter: Intl.DateTimeFormat
  milliseconds: number
  plain?: boolean
  [legacyTimeZoneName]?: string
  [legacyHostDateBoundary]?: number
}
const limit = 8640000000000000
const cycle = 146097 * 86400000
// ECMA-262 §28.1.1 step 4 invokes the captured formatter directly.
// https://tc39.es/ecma262/#sec-reflect.apply
const apply = Reflect.apply
const NumberConstructor = globalThis.Intl?.NumberFormat
const numberFormat =
  NumberConstructor &&
  Object.getOwnPropertyDescriptor(NumberConstructor.prototype, 'format')?.get
type Resolved = typeof Intl.DateTimeFormat.prototype.resolvedOptions
type Parts = typeof Intl.DateTimeFormat.prototype.formatToParts
type RangeParts = typeof Intl.DateTimeFormat.prototype.formatRangeToParts
type Format = (this: Intl.DateTimeFormat) => (value?: number) => string
const nativeParts = globalThis.Intl?.DateTimeFormat?.prototype.formatToParts

// Temporal §15.6.15 steps 2–6 format the PlainDate's ISO civil date.
// https://tc39.es/proposal-temporal/#sec-temporal-handledatetimetemporaldate
export function hostDateBoundary(
  value: TemporalDateTimeValue,
  calendar: string
): number | undefined {
  if (value.kind !== 'PlainDate') return undefined
  const milliseconds = value.epochNanoseconds / 1_000_000n
  if (milliseconds >= -limit && milliseconds <= limit) return undefined
  // Keep local calendar arithmetic for calendars Temporal implements.
  if (arrayIncludes(calendarIds, calendar as CalendarId)) return undefined
  return milliseconds < 0n ? -limit : limit
}

// ECMA-402 §11.5.7 steps 2–5 and §11.5.10 steps 2–5: Copy the parts in order.
function replacePartValues<T extends Intl.DateTimeFormatPart>(
  parts: T[],
  type: T['type'],
  value: (part: T) => string
): T[] {
  const result: T[] = []
  for (let index = 0; index < parts.length; index++) {
    const part = parts[index]
    setDataProperty(
      result,
      index,
      part.type === type ? {...part, value: value(part)} : part
    )
  }
  return result
}

// ECMA-402 §11.5.6 and §11.5.9 steps 2–4: Concatenate part values in order.
function joinPartValues(parts: Intl.DateTimeFormatPart[]): string {
  let text = ''
  for (let index = 0; index < parts.length; index++) text += parts[index].value
  return text
}

function clipped(value: LegacyDateTimeProjection): boolean {
  // ECMA-262 §21.4.1.31 step 2: detect plain values that need a surrogate.
  return value.plain === true && mathAbs(value.milliseconds) > limit
}
function gregorian(
  formatter: Intl.DateTimeFormat,
  resolved: Resolved
): boolean {
  // ECMA-402 §11.5.11 step 4.a: identify Gregorian-style projections.
  const calendar = apply(resolved, formatter, []).calendar
  return calendar === 'iso8601' || calendar === 'gregory'
}
function shift(value: LegacyDateTimeProjection): number {
  // ECMA-262 §21.4.1.5 steps 2–6: shift by one whole 400-year cycle.
  return clipped(value) ? (value.milliseconds < 0 ? cycle : -cycle) : 0
}
function years(
  value: LegacyDateTimeProjection,
  delta: number,
  resolved: Resolved
): (text: string) => string {
  if (!delta) return text => text
  if (!NumberConstructor || !numberFormat)
    throw new RangeErrorConstructor(
      'Extended Gregorian dates require Intl.NumberFormat'
    )
  // ECMA-402 §11.5.4 steps 1 and 3–5: preserve locale and numbering system.
  const options = apply(resolved, value.formatter, []),
    formatter = new NumberConstructor(options.locale, {
      numberingSystem: options.numberingSystem,
      useGrouping: false,
      maximumFractionDigits: 0,
    }),
    format = apply(numberFormat, formatter, []) as (value: number) => string,
    // ECMA-262 §21.4.1.7 step 1: find the real and surrogate years.
    year = YearFromTime(value.milliseconds),
    surrogate = YearFromTime(value.milliseconds + delta),
    // ECMA-402 §11.5.4 step 15.f.iv: convert each signed year to display year.
    original = format(year <= 0 ? 1 - year : year),
    replacement = format(surrogate <= 0 ? 1 - surrogate : surrogate)
  // ECMA-402 §11.5.4 step 15.f.iv: restore only the surrogate year label.
  return text => (text === replacement ? original : text)
}

export function legacyDateTimeParts(
  value: LegacyDateTimeProjection,
  parts: Parts,
  resolved: Resolved
): Intl.DateTimeFormatPart[] {
  // ECMA-402 §11.5.4 steps 15.e.iv–v: restore the projected timezone label.
  if (value[legacyTimeZoneName] !== undefined)
    return replacePartValues(
      legacyDateTimeParts(
        {...value, [legacyTimeZoneName]: undefined},
        parts,
        resolved
      ),
      'timeZoneName',
      // ECMA-402 §11.5.4 step 15.e.v: use the projected zone label.
      () => value[legacyTimeZoneName]!
    )
  const calendar = legacyCalendarParts(value, parts, resolved)
  if (calendar) return calendar
  // ECMA-402 §11.5.7 step 1: delegate the native numeric partition.
  if (!clipped(value) || !gregorian(value.formatter, resolved))
    return correctLunisolarParts(
      value,
      apply(parts, value.formatter, [value.milliseconds]),
      resolved
    )
  const delta = shift(value),
    rewrite = years(value, delta, resolved)
  // ECMA-402 §11.5.7 step 1: partition the surrogate and restore its year.
  return replacePartValues(
    apply(parts, value.formatter, [value.milliseconds + delta]),
    'year',
    // ECMA-402 §11.5.7 step 4.c: restore the returned year value.
    part => rewrite(part.value)
  )
}

export function legacyDateTimeFormat(
  value: LegacyDateTimeProjection,
  format: Format,
  parts: Parts,
  resolved: Resolved
): string {
  // ECMA-402 §11.5.6 steps 2–4: concatenate the corrected part values.
  if (value[legacyTimeZoneName] !== undefined)
    return joinPartValues(legacyDateTimeParts(value, parts, resolved))
  const calendar = legacyCalendarParts(value, parts, resolved)
  // ECMA-402 §11.5.6 steps 2–4: Concatenate corrected calendar part values.
  if (calendar) return joinPartValues(calendar)
  if (!clipped(value) || !gregorian(value.formatter, resolved)) {
    const calendar = apply(resolved, value.formatter, []).calendar
    if (calendar !== 'chinese' && calendar !== 'dangi')
      // ECMA-402 §11.3.3 step 4.a.ii: forward the ordinary numeric format call.
      return apply(format, value.formatter, [])(value.milliseconds)
    const raw = apply(parts, value.formatter, [value.milliseconds]),
      corrected = correctLunisolarParts(value, raw, resolved)
    // ECMA-402 §11.5.6 steps 2–4: Concatenate corrected lunar parts when the
    // host labels changed.
    return corrected === raw
      ? apply(format, value.formatter, [])(value.milliseconds)
      : joinPartValues(corrected)
  }
  // ECMA-402 §11.5.6 steps 2–4: Concatenate restored parts for the extended
  // Gregorian projection.
  return joinPartValues(legacyDateTimeParts(value, parts, resolved))
}

function rangeShifts(
  first: LegacyDateTimeProjection,
  last: LegacyDateTimeProjection
): [number, number] {
  const delta = shift(first) || shift(last)
  // ECMA-402 §11.5.8 steps 1–4: select host-safe endpoints without crossing
  // eras.
  const fits = (value: LegacyDateTimeProjection): boolean =>
    mathAbs(value.milliseconds + delta) <= limit &&
    YearFromTime(value.milliseconds) <= 0 ===
      YearFromTime(value.milliseconds + delta) <= 0
  return fits(first) && fits(last)
    ? [delta, delta]
    : [shift(first), shift(last)]
}

function hostBoundaryRangeParts(
  first: LegacyDateTimeProjection,
  last: LegacyDateTimeProjection,
  parts: RangeParts
): Intl.DateTimeRangeFormatPart[] | undefined {
  const start = first[legacyHostDateBoundary]
  const end = last[legacyHostDateBoundary]
  if (start === undefined && end === undefined) return undefined
  if (start !== undefined && end !== undefined && start !== end) {
    // Opposite Date limits need different host zones. Use the locale's
    // fallback interval with the independently formatted endpoint labels.
    // https://tc39.es/ecma402/#sec-partitiondatetimerangepattern
    return joinCalendarRangeParts(
      first.formatter,
      apply(nativeParts!, first.formatter, [first.milliseconds]),
      apply(nativeParts!, last.formatter, [last.milliseconds]),
      parts,
      false
    )
  }
  // Ordinary PlainDate projections use noon, which stays on the same date
  // in either UTC or the lower boundary formatter's UTC−12 zone.
  return apply(parts, end === -limit ? last.formatter : first.formatter, [
    first.milliseconds,
    last.milliseconds,
  ])
}

export function legacyDateTimeRangeParts(
  first: LegacyDateTimeProjection,
  last: LegacyDateTimeProjection,
  parts: RangeParts,
  resolved: Resolved
): Intl.DateTimeRangeFormatPart[] {
  const boundary = hostBoundaryRangeParts(first, last, parts)
  if (boundary) return boundary
  const extended = legacyCalendarRangeParts(
    first,
    last,
    nativeParts!,
    parts,
    resolved
  )
  if (extended) return extended
  const lunar = lunisolarRangeParts(first, last, parts, resolved)
  if (lunar) return lunar
  if (
    (!clipped(first) && !clipped(last)) ||
    !gregorian(first.formatter, resolved)
  )
    // ECMA-402 §11.5.10 step 1: delegate range partitioning on the native path.
    return apply(parts, first.formatter, [
      first.milliseconds,
      last.milliseconds,
    ])
  const shifts = rangeShifts(first, last),
    start = shifts[0],
    end = shifts[1],
    rewriteStart = years(first, start, resolved),
    rewriteEnd = years(last, end, resolved)
  // ECMA-402 §11.5.8 steps 19.c–e: choose the year rewrite by part source.
  return replacePartValues(
    apply(parts, first.formatter, [
      first.milliseconds + start,
      last.milliseconds + end,
    ]),
    'year',
    // ECMA-402 §11.5.8 steps 19.c–e: choose the rewrite by part source.
    part => (part.source === 'endRange' ? rewriteEnd : rewriteStart)(part.value)
  )
}

export function legacyDateTimeRangeFormat(
  first: LegacyDateTimeProjection,
  last: LegacyDateTimeProjection,
  format: typeof Intl.DateTimeFormat.prototype.formatRange,
  parts: RangeParts,
  resolved: Resolved
): string {
  const boundary = hostBoundaryRangeParts(first, last, parts)
  if (boundary) return joinPartValues(boundary)
  const extended = legacyCalendarRangeParts(
    first,
    last,
    nativeParts!,
    parts,
    resolved
  )
  // ECMA-402 §11.5.9 steps 2–4: concatenate the corrected range values.
  if (extended) return joinPartValues(extended)
  const lunar = lunisolarRangeParts(first, last, parts, resolved)
  // ECMA-402 §11.5.9 steps 2–4: Concatenate the corrected lunar range values.
  if (lunar) return joinPartValues(lunar)
  if (
    (!clipped(first) && !clipped(last)) ||
    !gregorian(first.formatter, resolved)
  )
    // ECMA-402 §11.3.4 step 6: forward the unchanged numeric range.
    return apply(format, first.formatter, [
      first.milliseconds,
      last.milliseconds,
    ])
  // ECMA-402 §11.5.9 steps 2–4: Concatenate the corrected extended range
  // values.
  return joinPartValues(legacyDateTimeRangeParts(first, last, parts, resolved))
}
