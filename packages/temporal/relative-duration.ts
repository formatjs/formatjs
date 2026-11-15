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
  dateUntil,
  epochDayOf,
  roundedDateTimeDifference,
  checkDateTime,
} from '#packages/temporal/date-core.js'
import {
  getDateSlot,
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

export type RelativeTo = {date: DateSlot} | {zoned: ZonedSlot}
export function toRelativeTo(value: unknown): RelativeTo | undefined {
  if (value === undefined) return undefined
  const zoned = getZonedSlot(value as object),
    date = getDateSlot(value as object)
  if (zoned) return {zoned}
  if (date) return {date}
  if (typeof value === 'string') {
    return /\[!?[^=\]]+\]/.test(value)
      ? {zoned: toZonedDateTimeSlot(value)}
      : {date: toPlainDateSlot(value)}
  }
  if (!object(value))
    throw new TypeError('relativeTo must be a string or object')
  const calendar = calendarFromObject(value),
    prepared = Object.create(null) as Record<string, unknown>
  const names = dateFieldNames(calendar, true, 'date', ['offset', 'timeZone'])
  for (let i = 0; i < names.length; i++) {
    const key = names[i],
      raw = value[key]
    if (raw === undefined) continue
    if (key === 'timeZone') prepared[key] = timeZoneIdentifier(raw)
    else if (key === 'offset') {
      const primitive = object(raw) ? ToPrimitive(raw, 'string') : raw
      if (typeof primitive !== 'string')
        throw new TypeError('Offset must be a string')
      parseOffsetNanoseconds(primitive)
      prepared[key] = primitive
    } else prepared[key] = dateFieldValue(key, raw)
  }
  if (prepared.timeZone !== undefined)
    return {zoned: toZonedDateTimeSlot({...prepared, calendar})}
  return {
    date: {calendar, epochDay: dayFromFields(calendar, prepared, 'constrain')},
  }
}
export function relativeOrigin(relative: RelativeTo): bigint {
  return 'zoned' in relative
    ? relative.zoned.epochNanoseconds
    : BigInt(relative.date.epochDay) * nsPerDay
}
export function relativeEndpoint(
  relative: RelativeTo,
  fields: DurationFields
): bigint {
  if ('zoned' in relative) return addZonedDuration(relative.zoned, fields)
  const end =
    BigInt(addDate(relative.date, fields, 'constrain')) * nsPerDay +
    durationNanoseconds(fields, false)
  const normalized = end - relativeOrigin(relative)
  if (
    normalized <= -maxDurationNanoseconds ||
    normalized >= maxDurationNanoseconds
  )
    throw new RangeError('Duration out of range')
  // Clock carry must keep target date in range.
  dayCheck(epochDayOf(end))
  return end
}
function validateZonedDay(fields: DurationFields, relative: RelativeTo): void {
  if (!('zoned' in relative)) return
  const calendar = {...fields},
    keys = [
      'hours',
      'minutes',
      'seconds',
      'milliseconds',
      'microseconds',
      'nanoseconds',
    ] as const
  for (let i = 0; i < keys.length; i++) calendar[keys[i]] = 0
  const anchor = addZonedDuration(relative.zoned, calendar),
    day = zeroDuration()
  day.days = durationSign(fields) || 1
  addZonedDuration({...relative.zoned, epochNanoseconds: anchor}, day)
}
export function relativeTotal(
  fields: DurationFields,
  relative: RelativeTo,
  unit: string
): number {
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
  if (unit === 'day') validateZonedDay(fields, relative)
  if (!durationSign(fields)) return 0
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
        BigInt(fields.weeks) * 7n * nsPerDay + durationNanoseconds(fields)
      if (value <= -maxDurationNanoseconds || value >= maxDurationNanoseconds)
        throw new RangeError('Duration out of range')
      dayCheck(epochDayOf(relativeOrigin(relative) + value))
      return durationTotalNumber(value, factors[unit])
    }
  }
  const start = relativeOrigin(relative),
    end = relativeEndpoint(relative, fields)
  if (
    unit !== 'year' &&
    unit !== 'month' &&
    unit !== 'week' &&
    (unit !== 'day' || 'date' in relative)
  )
    return durationTotalNumber(end - start, factors[unit])
  if ('date' in relative) checkDateTime(end)
  const difference =
    'zoned' in relative
      ? unroundedZonedDifference(relative.zoned, end, unit)
      : dateUntil(relative.date, epochDayOf(end), unit)
  let count = difference[(unit + 's') as keyof DurationFields]
  const candidate = zeroDuration()
  candidate[(unit + 's') as keyof DurationFields] = count
  let a = relativeEndpoint(relative, candidate)
  const sign = end < start ? -1 : end > start ? 1 : 0
  while ((a - end) * BigInt(sign) > 0n) {
    count -= sign
    candidate[(unit + 's') as keyof DurationFields] = count
    a = relativeEndpoint(relative, candidate)
  }
  if (a === end) return count || 0
  candidate[(unit + 's') as keyof DurationFields] = count + sign
  let b = relativeEndpoint(relative, candidate)
  while ((end - b) * BigInt(sign) >= 0n) {
    count += sign
    a = b
    if (a === end) return count || 0
    candidate[(unit + 's') as keyof DurationFields] = count + sign
    b = relativeEndpoint(relative, candidate)
  }
  const span = (b - a) * BigInt(sign)
  return durationTotalNumber(BigInt(count) * span + end - a, span)
}

export function relativeRound(
  fields: DurationFields,
  relative: RelativeTo,
  largest: string,
  smallest: string,
  increment: number,
  mode: RoundingMode
): DurationFields {
  const start = relativeOrigin(relative)
  if (durationSign(fields) && 'date' in relative) checkDateTime(start)
  const end = relativeEndpoint(relative, fields)
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
    const count = full.weeks + Math.trunc(full.days / 7)
    result.weeks = count
    const a = relativeEndpoint(relative, result)
    if (a === end) return result
    const sign = end < start ? -1 : 1
    result.weeks = count + sign
    const b = relativeEndpoint(relative, result),
      span = (b - a) * BigInt(sign)
    result.weeks = Number(
      roundDuration(BigInt(count) * span + end - a, span, mode) / span
    )
    return result
  }
  if ('zoned' in relative) {
    if (largest === 'day') validateZonedDay(fields, relative)
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
        false
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
