// Experimental numeric kernel. No Temporal object/coercion/branding semantics.
import {
  DateFromTime,
  DayFromYear,
  DaysInYear,
  MonthFromTime,
  YearFromTime,
} from '#packages/ecma262-abstract/DateOperations.js'
import {TimeZoneOffset} from '#packages/ecma402-abstract/DateTimeFormat/TimeZoneOffset.js'
import type {UnpackedTimeZoneData} from '#packages/ecma402-abstract/types/date-time.js'

const second = 1_000_000_000n
const day = 86400n * second
const limit = 100_000_000n * day
const monthStarts = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334]

export interface ISODateTime {
  year: number
  month: number
  day: number
  hour?: number
  minute?: number
  second?: number
  millisecond?: number
  microsecond?: number
  nanosecond?: number
}
export type Disambiguation = 'compatible' | 'earlier' | 'later' | 'reject'
export interface TimeZoneKernel {
  offsetNanoseconds(instant: bigint): bigint
  possibleInstants(fields: ISODateTime): bigint[]
  resolve(fields: ISODateTime, disambiguation?: Disambiguation): bigint
}

function floorDivide(value: bigint, divisor: bigint): bigint {
  const quotient = value / divisor
  return value < 0n && value % divisor !== 0n ? quotient - 1n : quotient
}

function checkInstant(value: bigint): bigint {
  if (value < -limit || value > limit)
    throw new RangeError('Instant out of range')
  return value
}

export function isoToEpochNanoseconds(fields: ISODateTime): bigint {
  const {year, month, day: date} = fields
  const time = [
    fields.hour ?? 0,
    fields.minute ?? 0,
    fields.second ?? 0,
    fields.millisecond ?? 0,
    fields.microsecond ?? 0,
    fields.nanosecond ?? 0,
  ]
  const bounds = [23, 59, 59, 999, 999, 999]
  if (
    ![year, month, date, ...time].every(Number.isInteger) ||
    Math.abs(year) > 275761 ||
    month < 1 ||
    month > 12 ||
    date < 1 ||
    date > 31 ||
    time.some((value, i) => value < 0 || value > bounds[i])
  ) {
    throw new RangeError('Invalid ISO fields')
  }
  const epochDay =
    DayFromYear(year) +
    monthStarts[month - 1] +
    Number(month > 2 && DaysInYear(year) === 366) +
    date -
    1
  if (
    MonthFromTime(epochDay * 86400000) !== month - 1 ||
    DateFromTime(epochDay * 86400000) !== date
  )
    throw new RangeError('Invalid ISO date')
  const value =
    BigInt(epochDay) * day +
    BigInt(time[0] * 3600 + time[1] * 60 + time[2]) * second +
    BigInt(time[3] * 1_000_000 + time[4] * 1000 + time[5])
  // Local fields may lie one offset beyond the instant range.
  if (value <= -limit - day || value >= limit + day)
    throw new RangeError('Local date out of range')
  return value
}

export function epochNanosecondsToISO(value: bigint): Required<ISODateTime> {
  if (value <= -limit - day || value >= limit + day)
    throw new RangeError('Local date out of range')
  const days = floorDivide(value, day)
  const milliseconds = Number(days) * 86400000
  let time = value - days * day
  const hour = Number(time / (3600n * second))
  time %= 3600n * second
  const minute = Number(time / (60n * second))
  time %= 60n * second
  const seconds = Number(time / second)
  time %= second
  return {
    year: YearFromTime(milliseconds),
    month: MonthFromTime(milliseconds) + 1,
    day: DateFromTime(milliseconds),
    hour,
    minute,
    second: seconds,
    millisecond: Number(time / 1_000_000n),
    microsecond: Number((time / 1000n) % 1000n),
    nanosecond: Number(time % 1000n),
  }
}

export function addISODays(
  fields: ISODateTime,
  days: number
): Required<ISODateTime> {
  if (!Number.isSafeInteger(days)) throw new RangeError('Invalid day count')
  return epochNanosecondsToISO(
    isoToEpochNanoseconds(fields) + BigInt(days) * day
  )
}

/** Caller supplies canonical zone data; offsets are seconds in the shared pack. */
export function createTimeZone(data: UnpackedTimeZoneData): TimeZoneKernel {
  const offsets = new Set(data.map(row => row[2]))
  if (data.future) {
    offsets.add(data.future.standardOffset)
    if (data.future.daylightOffset !== undefined)
      offsets.add(data.future.daylightOffset)
  }
  const offsetNanoseconds = (instant: bigint): bigint => {
    checkInstant(instant)
    return (
      BigInt(
        TimeZoneOffset(Number(floorDivide(instant, 1_000_000n)), data)[0]
      ) * second
    )
  }
  const possibleInstants = (fields: ISODateTime): bigint[] => {
    const local = isoToEpochNanoseconds(fields)
    const candidates: bigint[] = []
    for (const offset of offsets) {
      const instant = local - BigInt(offset) * second
      if (instant < -limit || instant > limit) continue
      if (instant + offsetNanoseconds(instant) === local)
        candidates.push(instant)
    }
    return candidates.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))
  }
  const resolve = (
    fields: ISODateTime,
    disambiguation: Disambiguation = 'compatible'
  ): bigint => {
    if (!['compatible', 'earlier', 'later', 'reject'].includes(disambiguation))
      throw new RangeError('Invalid disambiguation')
    const candidates = possibleInstants(fields)
    if (candidates.length === 1) return candidates[0]
    if (disambiguation === 'reject')
      throw new RangeError('Ambiguous or nonexistent local time')
    if (candidates.length)
      return candidates[disambiguation === 'later' ? candidates.length - 1 : 0]
    const local = isoToEpochNanoseconds(fields)
    // Spike assumes IANA gaps are isolated within this two-day window.
    const before = offsetNanoseconds(
      local - day < -limit ? -limit : local - day
    )
    const after = offsetNanoseconds(local + day > limit ? limit : local + day)
    if (after <= before) throw new RangeError('No matching instant')
    return checkInstant(local - (disambiguation === 'earlier' ? after : before))
  }
  return {offsetNanoseconds, possibleInstants, resolve}
}
