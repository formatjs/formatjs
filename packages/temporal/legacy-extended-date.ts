import {YearFromTime} from '#packages/ecma262-abstract/DateOperations.js'
import {
  legacyCalendarParts,
  legacyCalendarRangeParts,
} from '#packages/temporal/legacy-calendar-date.js'
import {
  correctLunisolarParts,
  lunisolarRangeParts,
} from '#packages/temporal/legacy-lunisolar-date.js'

export interface LegacyDateTimeProjection {
  formatter: Intl.DateTimeFormat
  milliseconds: number
  plain?: boolean
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
const nativeParts = globalThis.Intl?.DateTimeFormat.prototype.formatToParts

function clipped(value: LegacyDateTimeProjection): boolean {
  return value.plain === true && Math.abs(value.milliseconds) > limit
}
function gregorian(
  formatter: Intl.DateTimeFormat,
  resolved: Resolved
): boolean {
  const calendar = resolved.call(formatter).calendar
  return calendar === 'iso8601' || calendar === 'gregory'
}
function shift(value: LegacyDateTimeProjection): number {
  return clipped(value) ? (value.milliseconds < 0 ? cycle : -cycle) : 0
}
function years(
  value: LegacyDateTimeProjection,
  delta: number,
  resolved: Resolved
): (text: string) => string {
  if (!delta) return text => text
  if (!NumberConstructor || !numberFormat)
    throw new RangeError('Extended Gregorian dates require Intl.NumberFormat')
  const options = resolved.call(value.formatter),
    formatter = new NumberConstructor(options.locale, {
      numberingSystem: options.numberingSystem,
      useGrouping: false,
      maximumFractionDigits: 0,
    }),
    format = numberFormat.call(formatter) as (value: number) => string,
    year = YearFromTime(value.milliseconds),
    surrogate = YearFromTime(value.milliseconds + delta),
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
  const calendar = legacyCalendarParts(value, parts, resolved)
  if (calendar) return calendar
  if (!clipped(value) || !gregorian(value.formatter, resolved))
    return correctLunisolarParts(
      value,
      parts.call(value.formatter, value.milliseconds),
      resolved
    )
  const delta = shift(value),
    rewrite = years(value, delta, resolved)
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
  const calendar = legacyCalendarParts(value, parts, resolved)
  if (calendar) return calendar.map(part => part.value).join('')
  if (!clipped(value) || !gregorian(value.formatter, resolved)) {
    const calendar = resolved.call(value.formatter).calendar
    if (calendar !== 'chinese' && calendar !== 'dangi')
      return format.call(value.formatter)(value.milliseconds)
    const raw = parts.call(value.formatter, value.milliseconds),
      corrected = correctLunisolarParts(value, raw, resolved)
    return corrected === raw
      ? format.call(value.formatter)(value.milliseconds)
      : corrected.map(part => part.value).join('')
  }
  return legacyDateTimeParts(value, parts, resolved)
    .map(part => part.value)
    .join('')
}

function rangeShifts(
  first: LegacyDateTimeProjection,
  last: LegacyDateTimeProjection
): [number, number] {
  const delta = shift(first) || shift(last)
  const fits = (value: LegacyDateTimeProjection): boolean =>
    Math.abs(value.milliseconds + delta) <= limit &&
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
    return parts.call(first.formatter, first.milliseconds, last.milliseconds)
  const [start, end] = rangeShifts(first, last),
    rewriteStart = years(first, start, resolved),
    rewriteEnd = years(last, end, resolved)
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
  if (extended) return extended.map(part => part.value).join('')
  const lunar = lunisolarRangeParts(first, last, parts, resolved)
  if (lunar) return lunar.map(part => part.value).join('')
  if (
    (!clipped(first) && !clipped(last)) ||
    !gregorian(first.formatter, resolved)
  )
    return format.call(first.formatter, first.milliseconds, last.milliseconds)
  return legacyDateTimeRangeParts(first, last, parts, resolved)
    .map(part => part.value)
    .join('')
}
