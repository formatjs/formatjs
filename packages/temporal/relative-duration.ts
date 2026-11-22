import {
  RangeErrorConstructor,
  TypeErrorConstructor,
  bigIntFrom,
  mathTrunc,
  numberFrom,
} from '#packages/ecma262-abstract/intrinsics.js'
import {createObject} from '#packages/temporal/intrinsics.js'
import {nativeTemporal} from '#packages/temporal/native.js'
import {dayCheck} from '#packages/temporal/calendar.js'
import {toDurationFields} from '#packages/temporal/duration.js'
import {roundDuration, type RoundingMode} from '#packages/temporal/rounding.js'
import {ToPrimitive} from '#packages/ecma262-abstract/ToPrimitive.js'
import {
  calendarFromObject,
  dateFieldNames,
  dateFieldValue,
  dayFromFields,
  object,
  nsPerDay,
  addDate,
  epochDayOf,
  roundedDateTimeDifference,
  unroundedDifference,
  checkDateTime,
} from '#packages/temporal/date-core.js'
import {
  getDateSlot,
  getDateTimeSlot,
  getZonedSlot,
  type DateSlot,
  type ZonedSlot,
} from '#packages/temporal/plain-slots.js'
import {toPlainDateSlot} from '#packages/temporal/plain-date.js'
import {
  addZonedDuration,
  toZonedDateTimeSlot,
  unroundedZonedDifference,
  differenceZonedDuration,
  createZonedDateTime,
} from '#packages/temporal/zoned-date-time.js'
import {timeZoneIdentifier} from '#packages/temporal/zones.js'
import {parseOffsetNanoseconds} from '#packages/temporal/instant-string.js'
import {
  durationNanoseconds,
  durationTotalNumber,
  zeroDuration,
  maxDurationNanoseconds,
  durationSign,
  type DurationFields,
} from '#packages/temporal/duration-core.js'

// Proposal comparison §13.19 steps 6.d–6.e.i: Route relative strings by a candidate zone annotation.
function hasTimeZoneAnnotation(value: string): boolean {
  let opening = -1
  for (let index = 0; index < value.length; index++) {
    const character = value[index]
    if (character === ']') {
      if (opening >= 0 && index - opening > 1) return true
      opening = -1
    } else if (character === '=') opening = -1
    else if (character === '[' && opening < 0) opening = index
  }
  return false
}

export type RelativeTo = {date: DateSlot} | {zoned: ZonedSlot}
// Proposal comparison §13.19 steps 2 and 5.a.i–5.c.ii: Prepare anchors from initialized Temporal values.
export function toRelativeTo(value: unknown): RelativeTo | undefined {
  if (value === undefined) return undefined
  // https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/abstractops.html#L607-L613
  // L607: recognize a zoned value by its internal slot.
  const zoned = getZonedSlot(value as object)
  // L608: retain the zoned anchor without reading public fields.
  if (zoned) return {zoned}
  // L609: recognize an initialized date.
  const date = getDateSlot(value as object)
  // L610: retain its internal date record.
  if (date) return {date}
  // L611: date-times also bypass property-bag conversion.
  const dateTime = getDateTimeSlot(value as object)
  if (dateTime) {
    // L612: copy its ISO date and calendar, discarding the clock.
    const date = {
      epochDay: epochDayOf(dateTime.epochNanoseconds),
      calendar: dateTime.calendar,
    }
    // L613: return only the plain anchor.
    return {date}
  }
  if (typeof value === 'string') {
    return hasTimeZoneAnnotation(value)
      ? {zoned: toZonedDateTimeSlot(value)}
      : {date: toPlainDateSlot(value)}
  }
  if (!object(value))
    throw new TypeErrorConstructor('relativeTo must be a string or object')
  const calendar = calendarFromObject(value),
    prepared = createObject(null) as Record<string, unknown>
  const names = dateFieldNames(calendar, true, 'date', ['offset', 'timeZone'])
  for (let i = 0; i < names.length; i++) {
    const key = names[i],
      raw = value[key]
    if (raw === undefined) continue
    if (key === 'timeZone') prepared[key] = timeZoneIdentifier(raw)
    else if (key === 'offset') {
      const primitive = object(raw) ? ToPrimitive(raw, 'string') : raw
      if (typeof primitive !== 'string')
        throw new TypeErrorConstructor('Offset must be a string')
      parseOffsetNanoseconds(primitive)
      prepared[key] = primitive
    } else prepared[key] = dateFieldValue(key, raw)
  }
  if (prepared.timeZone !== undefined) {
    prepared.calendar = calendar
    return {zoned: toZonedDateTimeSlot(prepared)}
  }
  return {
    date: {calendar, epochDay: dayFromFields(calendar, prepared, 'constrain')},
  }
}
// Proposal comparison §7.3.21 steps 12.d and 13.f and §5.5.14 step 5: Read the exact relative origin.
export function relativeOrigin(relative: RelativeTo): bigint {
  return 'zoned' in relative
    ? relative.zoned.epochNanoseconds
    : bigIntFrom(relative.date.epochDay) * nsPerDay
}
// Proposal comparison §7.3.21 steps 12.e, 13.e and 13.g: Form a constrained duration endpoint.
export function relativeEndpoint(
  relative: RelativeTo,
  fields: DurationFields
): bigint {
  if ('zoned' in relative) return addZonedDuration(relative.zoned, fields)
  const end =
    bigIntFrom(addDate(relative.date, fields, 'constrain')) * nsPerDay +
    durationNanoseconds(fields, false)
  const normalized = end - relativeOrigin(relative)
  if (
    normalized <= -maxDurationNanoseconds ||
    normalized >= maxDurationNanoseconds
  )
    throw new RangeErrorConstructor('Duration out of range')
  // Clock carry must keep target date in range.
  dayCheck(epochDayOf(end))
  return end
}
export function relativeTotal(
  fields: DurationFields,
  relative: RelativeTo,
  unit: string
): number {
  const native = nativeTemporal()
  if (import.meta.formatjsTemporalNativeData === true || native)
    return native!.totalDuration(fields, unit, relative)
  const factors: Record<string, bigint> = {
    week: 7n * nsPerDay,
    day: nsPerDay,
    hour: 3_600_000_000_000n,
    minute: 60_000_000_000n,
    second: 1_000_000_000n,
    millisecond: 1_000_000n,
    microsecond: 1000n,
    nanosecond: 1n,
  }
  const calendarUnit = unit === 'year' || unit === 'month' || unit === 'week'
  // DifferencePlainDateTimeWithTotal L1023 permits the plain zero shortcut.
  // TotalRelativeDuration L1907-L1909 still nudges zero zoned calendar totals.
  if (
    !durationSign(fields) &&
    ('date' in relative || (!calendarUnit && unit !== 'day'))
  )
    return 0
  if ('date' in relative) {
    checkDateTime(relativeOrigin(relative))
    if (
      !fields.years &&
      !fields.months &&
      unit !== 'year' &&
      unit !== 'month' &&
      unit !== 'week'
    ) {
      const value =
        bigIntFrom(fields.weeks) * 7n * nsPerDay + durationNanoseconds(fields)
      if (value <= -maxDurationNanoseconds || value >= maxDurationNanoseconds)
        throw new RangeErrorConstructor('Duration out of range')
      // Temporal comparison §5.5.14 step2 precedes fixed-unit total arithmetic.
      checkDateTime(relativeOrigin(relative) + value)
      return durationTotalNumber(value, factors[unit])
    }
  }
  const start = relativeOrigin(relative),
    end = relativeEndpoint(relative, fields)
  // Temporal comparison §5.5.14 steps1–2 preserve equality before endpoint limits.
  if ('date' in relative && end !== start) checkDateTime(end)
  if (
    unit !== 'year' &&
    unit !== 'month' &&
    unit !== 'week' &&
    (unit !== 'day' || 'date' in relative)
  )
    return durationTotalNumber(end - start, factors[unit])
  // Proposal comparison §5.5.14 step 3 and §5.5.12 steps 3–9:
  // Include the clock borrow before selecting the plain calendar bounds.
  const difference =
    'zoned' in relative
      ? unroundedZonedDifference(relative.zoned, end, unit)
      : unroundedDifference(start, end, relative.date.calendar, unit)
  // Proposal comparison §6.5.8 step 4 uses the unrounded count, exact
  // endpoints and original anchor for the zoned total.
  let count = difference[(unit + 's') as keyof DurationFields]
  const candidate = zeroDuration()
  candidate[(unit + 's') as keyof DurationFields] = count
  let a = relativeEndpoint(relative, candidate)
  // https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/duration.html#L1908
  // L1908: zero uses the positive window.
  const sign = end < start ? -1 : 1
  // Proposal comparison §7.5.33 steps 8–12: Validate both initial endpoints before retrying.
  candidate[(unit + 's') as keyof DurationFields] = count + sign
  let b = relativeEndpoint(relative, candidate)
  while ((a - end) * bigIntFrom(sign) > 0n) {
    count -= sign
    b = a
    candidate[(unit + 's') as keyof DurationFields] = count
    a = relativeEndpoint(relative, candidate)
  }
  if (a === end) return count || 0
  while ((end - b) * bigIntFrom(sign) >= 0n) {
    count += sign
    a = b
    if (a === end) return count || 0
    candidate[(unit + 's') as keyof DurationFields] = count + sign
    b = relativeEndpoint(relative, candidate)
  }
  const span = (b - a) * bigIntFrom(sign)
  return durationTotalNumber(bigIntFrom(count) * span + end - a, span)
}

export function relativeRound(
  fields: DurationFields,
  relative: RelativeTo,
  largest: string,
  smallest: string,
  increment: number,
  mode: RoundingMode
): DurationFields {
  const native = nativeTemporal()
  if (import.meta.formatjsTemporalNativeData === true || native)
    return native!.roundDuration(
      fields,
      largest,
      smallest,
      increment,
      mode,
      relative
    )
  const start = relativeOrigin(relative)
  if (durationSign(fields) && 'date' in relative) checkDateTime(start)
  const end = relativeEndpoint(relative, fields)
  // Temporal comparison §5.5.13 steps1–2 preserve equal-zero shortcuts.
  if ('date' in relative && end !== start) checkDateTime(end)
  if (smallest === 'week' && (largest === 'year' || largest === 'month')) {
    const full =
      'zoned' in relative
        ? unroundedZonedDifference(relative.zoned, end, largest)
        : roundedDateTimeDifference(
            start,
            end,
            relative.date.calendar,
            largest,
            'nanosecond',
            1,
            'trunc',
            false
          )
    const result = zeroDuration()
    result.years = full.years
    result.months = full.months
    const count = full.weeks + mathTrunc(full.days / 7)
    result.weeks = count
    const a = relativeEndpoint(relative, result)
    if ('date' in relative && start === end) return result
    const sign = end < start ? -1 : 1
    result.weeks = count + sign
    const b = relativeEndpoint(relative, result),
      span = (b - a) * bigIntFrom(sign)
    // Exact calendar results still validate the next nudge endpoint.
    if (a === end) {
      result.weeks = count
      return result
    }
    // Proposal comparison §7.5.34 steps 5–6: Reuse shared rounding outside the week window.
    const distance = (end - a) * bigIntFrom(sign)
    if (0n <= distance && distance <= span) {
      result.weeks = numberFrom(
        roundDuration(bigIntFrom(count) * span + end - a, span, mode) / span
      )
      return result
    }
  }
  if ('zoned' in relative) {
    const result = toDurationFields(
      differenceZonedDuration(
        relative.zoned,
        createZonedDateTime(
          end,
          relative.zoned.timeZone,
          relative.zoned.calendar
        ),
        {
          largestUnit: largest,
          smallestUnit: smallest,
          roundingIncrement: increment,
          roundingMode: mode,
        },
        false,
        true
      )
    )
    return result
  }
  const result = roundedDateTimeDifference(
    start,
    end,
    relative.date.calendar,
    largest,
    smallest,
    increment,
    mode,
    false
  )
  return result
}
