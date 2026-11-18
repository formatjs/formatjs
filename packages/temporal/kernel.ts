import {nativeTemporal} from '#packages/temporal/native.js'
// Experimental numeric kernel. No Temporal object/coercion/branding semantics.
import {
  DayFromYear,
  DaysInYear,
  YearFromTime,
} from '#packages/ecma262-abstract/DateOperations.js'
import {
  TimeZoneOffset,
  TimeZoneRuleTransition,
} from '#packages/ecma402-abstract/DateTimeFormat/TimeZoneOffset.js'
import {ArithmeticGregorianFromEpochDay} from '#packages/ecma402-abstract/Calendar/Arithmetic.js'
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
  transition(instant: bigint, direction: 'next' | 'previous'): bigint | null
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
  const native = nativeTemporal()
  if (import.meta.formatjsTemporalNativeData === true || native)
    return native!.isoToEpochNanoseconds(fields)
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
    ![year, month, date].every(Number.isInteger) ||
    !time.every(Number.isInteger) ||
    Math.abs(year) > 275761 ||
    month < 1 ||
    month > 12 ||
    date < 1 ||
    date > 31 ||
    time.some((value, i) => value < 0 || value > bounds[i])
  ) {
    throw new RangeError('Invalid ISO fields')
  }
  const leap = DaysInYear(year) === 366
  const maximum =
    month === 2
      ? leap
        ? 29
        : 28
      : month === 4 || month === 6 || month === 9 || month === 11
        ? 30
        : 31
  if (date > maximum) throw new RangeError('Invalid ISO date')
  const epochDay =
    DayFromYear(year) +
    monthStarts[month - 1] +
    Number(month > 2 && leap) +
    date -
    1
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
  const native = nativeTemporal()
  if (import.meta.formatjsTemporalNativeData === true || native)
    return native!.epochNanosecondsToISO(value)
  if (value <= -limit - day || value >= limit + day)
    throw new RangeError('Local date out of range')
  const days = floorDivide(value, day)
  const epochDay = Number(days)
  let time = value - days * day
  const hour = Number(time / (3600n * second))
  time %= 3600n * second
  const minute = Number(time / (60n * second))
  time %= 60n * second
  const seconds = Number(time / second)
  time %= second
  const date = ArithmeticGregorianFromEpochDay('iso8601', epochDay)
  return {
    year: date.year,
    month: date.month,
    day: date.day,
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
  const native = nativeTemporal()
  if (import.meta.formatjsTemporalNativeData === true || native)
    return native!.addISODays(fields, days)
  if (!Number.isSafeInteger(days)) throw new RangeError('Invalid day count')
  return epochNanosecondsToISO(
    isoToEpochNanoseconds(fields) + BigInt(days) * day
  )
}

function zoneTransition(
  data: UnpackedTimeZoneData,
  instant: bigint,
  direction: 'next' | 'previous'
): bigint | null {
  const next = direction === 'next'
  let best: bigint | null = null
  const consider = (seconds: number): void => {
    if (!Number.isFinite(seconds)) return
    const candidate = BigInt(seconds) * second
    if (
      candidate < -limit ||
      candidate > limit ||
      (next ? candidate <= instant : candidate >= instant)
    )
      return
    if (best !== null && (next ? candidate >= best : candidate <= best)) return
    if (
      TimeZoneOffset(seconds * 1000 - 1, data)[0] ===
      TimeZoneOffset(seconds * 1000, data)[0]
    )
      return
    best = candidate
  }
  let low = 0,
    high = data.length
  while (low < high) {
    const middle = (low + high) >>> 1,
      candidate = data[middle][0]
    if (candidate <= Number(floorDivide(instant, second))) low = middle + 1
    else high = middle
  }
  // Compare exact nanoseconds after finding the neighboring second.
  let index = Math.max(0, Math.min(data.length - 1, low - 1))
  if (next) {
    for (; index < data.length; index++) {
      consider(data[index][0])
      if (best !== null) break
    }
  } else {
    for (; index > 0; index--) {
      consider(data[index][0])
      if (best !== null) break
    }
  }
  const future = data.future,
    cutoff = data[data.length - 1][0]
  if (
    !future?.start ||
    !future.end ||
    future.daylightOffset === undefined ||
    future.daylightOffset === future.standardOffset ||
    (!next && Number(instant / second) < cutoff)
  )
    return best
  if (next && best !== null && best <= BigInt(cutoff) * second) return best
  const base = YearFromTime(Number(floorDivide(instant, 1_000_000n)))
  const edgeYear = Number.isFinite(cutoff) ? YearFromTime(cutoff * 1000) : base
  const year = next ? Math.max(base, edgeYear) : base
  // Gregorian POSIX rules repeat every 400 years. Include adjacent years for extended times.
  let recurringFound = false
  for (let distance = -1; distance <= 401; distance++) {
    const y = year + (next ? distance : -distance)
    const begin =
      TimeZoneRuleTransition(y, future.start) - future.standardOffset
    const end = TimeZoneRuleTransition(y, future.end) - future.daylightOffset
    const previous: bigint | null = best
    if (begin > cutoff) consider(begin)
    if (end > cutoff) consider(end)
    recurringFound ||= previous !== best
    if (distance >= 1 && recurringFound) break
    if (!next && Number.isFinite(cutoff) && y < edgeYear - 1) break
  }
  return best
}

/** Caller supplies canonical zone data; offsets are seconds in the shared pack. */
export function createTimeZone(data: UnpackedTimeZoneData): TimeZoneKernel {
  const offsets = new Set<number>()
  for (let i = 0; i < data.length; i++) offsets.add(data[i][2])
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
    let minimum = Infinity,
      maximum = -Infinity
    for (const offset of offsets) {
      minimum = Math.min(minimum, offset)
      maximum = Math.max(maximum, offset)
    }
    const lower = local - BigInt(maximum) * second,
      upper = local - BigInt(minimum) * second
    let event = zoneTransition(
      data,
      lower < -limit ? -limit : lower - 1n,
      'next'
    )
    while (event !== null && event <= upper) {
      if (event > -limit) {
        const before = offsetNanoseconds(event - 1n),
          after = offsetNanoseconds(event)
        if (after > before && local >= event + before && local < event + after)
          return checkInstant(
            local - (disambiguation === 'earlier' ? after : before)
          )
      }
      event = zoneTransition(data, event, 'next')
    }
    throw new RangeError('No matching instant')
  }
  return {
    offsetNanoseconds,
    possibleInstants,
    resolve,
    transition: (instant, direction) => {
      checkInstant(instant)
      return zoneTransition(data, instant, direction)
    },
  }
}
