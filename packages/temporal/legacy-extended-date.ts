import {
  RangeErrorConstructor,
  mathAbs,
} from '#packages/ecma262-abstract/intrinsics.js'
import {YearFromTime} from '#packages/ecma262-abstract/DateOperations.js'
import {
  legacyCalendarParts,
  legacyCalendarRangeParts,
} from '#packages/temporal/legacy-calendar-date.js'
import {
  correctLunisolarParts,
  lunisolarRangeParts,
} from '#packages/temporal/legacy-lunisolar-date.js'

export const legacyTimeZoneName: unique symbol = Symbol()

export interface LegacyDateTimeProjection {
  formatter: Intl.DateTimeFormat
  milliseconds: number
  plain?: boolean
  [legacyTimeZoneName]?: string
}
const limit = 8640000000000000
const cycle = 146097 * 86400000
const NumberConstructor = globalThis.Intl?.NumberFormat
const numberFormat =
  NumberConstructor &&
  Object.getOwnPropertyDescriptor(NumberConstructor.prototype, 'format')?.get
type Resolved = typeof Intl.DateTimeFormat.prototype.resolvedOptions
type Parts = typeof Intl.DateTimeFormat.prototype.formatToParts
type RangeParts = typeof Intl.DateTimeFormat.prototype.formatRangeToParts
type Format = (this: Intl.DateTimeFormat) => (value?: number) => string
const nativeParts = globalThis.Intl?.DateTimeFormat?.prototype.formatToParts

function clipped(value: LegacyDateTimeProjection): boolean {
  // ECMA-262 §21.4.1.31 step 2: detect plain values that need a surrogate.
  return value.plain === true && mathAbs(value.milliseconds) > limit
}
function gregorian(
  formatter: Intl.DateTimeFormat,
  resolved: Resolved
): boolean {
  // ECMA-402 §11.5.11 step 4.a: identify Gregorian-style projections.
  const calendar = resolved.call(formatter).calendar
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
  const options = resolved.call(value.formatter),
    formatter = new NumberConstructor(options.locale, {
      numberingSystem: options.numberingSystem,
      useGrouping: false,
      maximumFractionDigits: 0,
    }),
    format = numberFormat.call(formatter) as (value: number) => string,
    // ECMA-262 §21.4.1.7 step 1: find the real and surrogate years.
    year = YearFromTime(value.milliseconds),
    surrogate = YearFromTime(value.milliseconds + delta),
    // ECMA-402 §11.5.4 step 15.f.iv: convert each signed year to display year.
    original = format(year <= 0 ? 1 - year : year),
    replacement = format(surrogate <= 0 ? 1 - surrogate : surrogate)
  // A 400-year shift preserves month/day/weekday and two-digit years.
  return text => (text === replacement ? original : text)
}

export function legacyDateTimeParts(
  value: LegacyDateTimeProjection,
  parts: Parts,
  resolved: Resolved
): Intl.DateTimeFormatPart[] {
  // ECMA-402 §11.5.4 steps 15.e.iv–v: restore the projected timezone label.
  if (value[legacyTimeZoneName] !== undefined)
    return legacyDateTimeParts(
      {...value, [legacyTimeZoneName]: undefined},
      parts,
      resolved
    ).map(part =>
      part.type === 'timeZoneName'
        ? {...part, value: value[legacyTimeZoneName]!}
        : part
    )
  const calendar = legacyCalendarParts(value, parts, resolved)
  if (calendar) return calendar
  // ECMA-402 §11.5.7 step 1: delegate the native numeric partition.
  if (!clipped(value) || !gregorian(value.formatter, resolved))
    return correctLunisolarParts(
      value,
      parts.call(value.formatter, value.milliseconds),
      resolved
    )
  const delta = shift(value),
    rewrite = years(value, delta, resolved)
  // ECMA-402 §11.5.7 step 1: partition the surrogate and restore its year.
  return parts
    .call(value.formatter, value.milliseconds + delta)
    .map(part =>
      part.type === 'year' ? {...part, value: rewrite(part.value)} : part
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
    return legacyDateTimeParts(value, parts, resolved)
      .map(part => part.value)
      .join('')
  const calendar = legacyCalendarParts(value, parts, resolved)
  // ECMA-402 §11.5.6 steps 2–4: Concatenate corrected calendar part values.
  if (calendar) return calendar.map(part => part.value).join('')
  if (!clipped(value) || !gregorian(value.formatter, resolved)) {
    const calendar = resolved.call(value.formatter).calendar
    if (calendar !== 'chinese' && calendar !== 'dangi')
      // ECMA-402 §11.3.3 step 4.a.ii: forward the ordinary numeric format call.
      return format.call(value.formatter)(value.milliseconds)
    const raw = parts.call(value.formatter, value.milliseconds),
      corrected = correctLunisolarParts(value, raw, resolved)
    // ECMA-402 §11.5.6 steps 2–4: Concatenate corrected lunar parts when the
    // host labels changed.
    return corrected === raw
      ? format.call(value.formatter)(value.milliseconds)
      : corrected.map(part => part.value).join('')
  }
  // ECMA-402 §11.5.6 steps 2–4: Concatenate restored parts for the extended
  // Gregorian projection.
  return legacyDateTimeParts(value, parts, resolved)
    .map(part => part.value)
    .join('')
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

export function legacyDateTimeRangeParts(
  first: LegacyDateTimeProjection,
  last: LegacyDateTimeProjection,
  parts: RangeParts,
  resolved: Resolved
): Intl.DateTimeRangeFormatPart[] {
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
    return parts.call(first.formatter, first.milliseconds, last.milliseconds)
  const [start, end] = rangeShifts(first, last),
    rewriteStart = years(first, start, resolved),
    rewriteEnd = years(last, end, resolved)
  // ECMA-402 §11.5.8 steps 19.c–e: choose the year rewrite by part source.
  return parts
    .call(first.formatter, first.milliseconds + start, last.milliseconds + end)
    .map(part =>
      part.type === 'year'
        ? {
            ...part,
            value: (part.source === 'endRange' ? rewriteEnd : rewriteStart)(
              part.value
            ),
          }
        : part
    )
}

export function legacyDateTimeRangeFormat(
  first: LegacyDateTimeProjection,
  last: LegacyDateTimeProjection,
  format: typeof Intl.DateTimeFormat.prototype.formatRange,
  parts: RangeParts,
  resolved: Resolved
): string {
  const extended = legacyCalendarRangeParts(
    first,
    last,
    nativeParts!,
    parts,
    resolved
  )
  // ECMA-402 §11.5.9 steps 2–4: concatenate the corrected range values.
  if (extended) return extended.map(part => part.value).join('')
  const lunar = lunisolarRangeParts(first, last, parts, resolved)
  // ECMA-402 §11.5.9 steps 2–4: Concatenate the corrected lunar range values.
  if (lunar) return lunar.map(part => part.value).join('')
  if (
    (!clipped(first) && !clipped(last)) ||
    !gregorian(first.formatter, resolved)
  )
    // ECMA-402 §11.3.4 step 6: forward the unchanged numeric range.
    return format.call(first.formatter, first.milliseconds, last.milliseconds)
  // ECMA-402 §11.5.9 steps 2–4: Concatenate the corrected extended range
  // values.
  return legacyDateTimeRangeParts(first, last, parts, resolved)
    .map(part => part.value)
    .join('')
}
