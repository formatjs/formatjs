import {HasOwnProperty} from '#packages/ecma262-abstract/HasOwnProperty.js'
import {
  RangeErrorConstructor,
  arrayEvery,
  arrayIncludes,
  arraySome,
  bigIntFrom,
  mathAbs,
  mathMax,
  mathMin,
  numberFrom,
  numberIsFinite,
  numberIsInteger,
  numberIsSafeInteger,
  setDataProperty,
} from '#packages/ecma262-abstract/intrinsics.js'
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

const arraySort = Array.prototype.sort
const apply = Reflect.apply
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
  // Internal callers validate local nanoseconds before using this shortcut.
  possibleInstantsFromEpochNanoseconds?(local: bigint): bigint[]
  resolve(fields: ISODateTime, disambiguation?: Disambiguation): bigint
}

function floorDivide(value: bigint, divisor: bigint): bigint {
  const quotient = value / divisor
  return value < 0n && value % divisor !== 0n ? quotient - 1n : quotient
}

function checkInstant(value: bigint): bigint {
  // https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/instant.html#L369
  // L369: inclusive exact epoch bounds; rejection implements the predicate false result.
  if (value < -limit || value > limit)
    throw new RangeErrorConstructor('Instant out of range')
  return value
}

export function isoToEpochNanoseconds(fields: ISODateTime): bigint {
  const native = nativeTemporal()
  if (import.meta.formatjsTemporalNativeData === true || native)
    return native!.isoToEpochNanoseconds(fields)
  const {year, month, day: date} = fields
  const time = [
    HasOwnProperty(fields, 'hour') ? (fields.hour ?? 0) : 0,
    HasOwnProperty(fields, 'minute') ? (fields.minute ?? 0) : 0,
    HasOwnProperty(fields, 'second') ? (fields.second ?? 0) : 0,
    HasOwnProperty(fields, 'millisecond') ? (fields.millisecond ?? 0) : 0,
    HasOwnProperty(fields, 'microsecond') ? (fields.microsecond ?? 0) : 0,
    HasOwnProperty(fields, 'nanosecond') ? (fields.nanosecond ?? 0) : 0,
  ]
  const bounds = [23, 59, 59, 999, 999, 999]
  if (
    !arrayEvery([year, month, date], numberIsInteger) ||
    !arrayEvery(time, numberIsInteger) ||
    mathAbs(year) > 275761 ||
    month < 1 ||
    month > 12 ||
    date < 1 ||
    date > 31 ||
    arraySome(time, (value, i) => value < 0 || value > bounds[i])
  ) {
    throw new RangeErrorConstructor('Invalid ISO fields')
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
  if (date > maximum) throw new RangeErrorConstructor('Invalid ISO date')
  const epochDay =
    DayFromYear(year) +
    monthStarts[month - 1] +
    numberFrom(month > 2 && leap) +
    date -
    1
  // https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/mainadditions.html#L356-L359
  // L356: valid clock fields give exact hour/minute/second/millisecond sums.
  // L357: day and clock terms equal MakeDate's millisecond composition.
  // L358: candidates admitted by the day bound have integral |ms| < 2**53.
  // L359: bigint composition retains all microsecond/nanosecond digits.
  const value =
    bigIntFrom(epochDay) * day +
    bigIntFrom(time[0] * 3600 + time[1] * 60 + time[2]) * second +
    bigIntFrom(time[3] * 1_000_000 + time[4] * 1000 + time[5])
  // https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindatetime.html#L762-L766
  // L762: for valid clocks, this interval also implies |epochDay| <= 100000001.
  // L764: equality at the lower local boundary is rejected.
  // L765: equality at the upper local boundary is rejected.
  if (value <= -limit - day || value >= limit + day)
    throw new RangeErrorConstructor('Local date out of range')
  // L766: successful return represents the predicate's true result.
  return value
}

// https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/timezone.html#L62-L77
// Line tags below refer to this pinned timezone.html.
export function epochNanosecondsToISO(value: bigint): Required<ISODateTime> {
  const native = nativeTemporal()
  if (import.meta.formatjsTemporalNativeData === true || native)
    return native!.epochNanosecondsToISO(value)
  // L62: the valid-Instant domain is contained in this wider local-time domain.
  if (value <= -limit - day || value >= limit + day)
    throw new RangeErrorConstructor('Local date out of range')
  // L64: exact day/clock division equals the spec's integral-millisecond split.
  // Valid-Instant milliseconds fit exactly below 2**53; no rounding is needed here.
  const days = floorDivide(value, day)
  const epochDay = numberFrom(days)
  // L63: day and clock units are multiples of 10**6, preserving its modulo remainder.
  let time = value - days * day
  // L68: the nonnegative day remainder determines the UTC hour.
  const hour = numberFrom(time / (3600n * second))
  time %= 3600n * second
  // L69: remove complete hours before selecting the UTC minute.
  const minute = numberFrom(time / (60n * second))
  time %= 60n * second
  // L70: remove complete minutes before selecting the UTC second.
  const seconds = numberFrom(time / second)
  time %= second
  // L65: the March-based Gregorian inverse yields the epoch year.
  // L66: that inverse already returns a one-based month.
  // L67: its day is the proleptic Gregorian day of month.
  const date = ArithmeticGregorianFromEpochDay('iso8601', epochDay)
  // L77: the flat private result combines the conceptual date and time records.
  return {
    // L75: preserve the three ISO date-record fields.
    year: date.year,
    month: date.month,
    day: date.day,
    // L76: preserve the six time-record fields.
    hour,
    minute,
    second: seconds,
    // L71: complete milliseconds within the current second.
    millisecond: numberFrom(time / 1_000_000n),
    // L72: discarding complete milliseconds equals flooring remainderNs / 1000.
    // L73: modulo 1000 guarantees a microsecond in 0..999.
    microsecond: numberFrom((time / 1000n) % 1000n),
    // L74: the final modulo gives the nanosecond within the microsecond.
    nanosecond: numberFrom(time % 1000n),
  }
}

export function addISODays(
  fields: ISODateTime,
  days: number
): Required<ISODateTime> {
  const native = nativeTemporal()
  if (import.meta.formatjsTemporalNativeData === true || native)
    return native!.addISODays(fields, days)
  if (!numberIsSafeInteger(days))
    throw new RangeErrorConstructor('Invalid day count')
  return epochNanosecondsToISO(
    isoToEpochNanoseconds(fields) + bigIntFrom(days) * day
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
    if (!numberIsFinite(seconds)) return
    const candidate = bigIntFrom(seconds) * second
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
    if (candidate <= numberFrom(floorDivide(instant, second))) low = middle + 1
    else high = middle
  }
  // Compare exact nanoseconds after finding the neighboring second.
  let index = mathMax(0, mathMin(data.length - 1, low - 1))
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
    (!next && numberFrom(instant / second) < cutoff)
  )
    return best
  if (next && best !== null && best <= bigIntFrom(cutoff) * second) return best
  const base = YearFromTime(numberFrom(floorDivide(instant, 1_000_000n)))
  const edgeYear = numberIsFinite(cutoff) ? YearFromTime(cutoff * 1000) : base
  const year = next ? mathMax(base, edgeYear) : base
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
    if (!next && numberIsFinite(cutoff) && y < edgeYear - 1) break
  }
  return best
}

/** Caller supplies canonical zone data; offsets are seconds in the shared pack. */
export function createTimeZone(data: UnpackedTimeZoneData): TimeZoneKernel {
  // Proposal comparison §11.1.13 steps3.a,5: private candidate collection.
  // https://tc39.es/proposal-temporal/#sec-temporal-getpossibleepochnanoseconds
  const offsets: number[] = []
  const addOffset = (value: number): void => {
    if (!arrayIncludes(offsets, value))
      setDataProperty(offsets, `${offsets.length}`, value)
  }
  for (let i = 0; i < data.length; i++) addOffset(data[i][2])
  if (data.future) {
    addOffset(data.future.standardOffset)
    if (data.future.daylightOffset !== undefined)
      addOffset(data.future.daylightOffset)
  }
  const offsetNanoseconds = (instant: bigint): bigint => {
    checkInstant(instant)
    return (
      bigIntFrom(
        TimeZoneOffset(numberFrom(floorDivide(instant, 1_000_000n)), data)[0]
      ) * second
    )
  }
  const possibleInstantsFromEpochNanoseconds = (local: bigint): bigint[] => {
    const candidates: bigint[] = []
    for (let index = 0; index < offsets.length; index++) {
      const offset = offsets[index]
      const instant = local - bigIntFrom(offset) * second
      if (instant < -limit || instant > limit) continue
      if (instant + offsetNanoseconds(instant) === local)
        setDataProperty(candidates, `${candidates.length}`, instant)
    }
    return apply(arraySort, candidates, [
      (a: bigint, b: bigint) => (a < b ? -1 : a > b ? 1 : 0),
    ])
  }
  const possibleInstants = (fields: ISODateTime): bigint[] =>
    possibleInstantsFromEpochNanoseconds(isoToEpochNanoseconds(fields))
  const resolve = (
    fields: ISODateTime,
    disambiguation: Disambiguation = 'compatible'
  ): bigint => {
    if (
      !arrayIncludes(
        ['compatible', 'earlier', 'later', 'reject'],
        disambiguation
      )
    )
      throw new RangeErrorConstructor('Invalid disambiguation')
    const candidates = possibleInstants(fields)
    if (candidates.length === 1) return candidates[0]
    if (disambiguation === 'reject')
      throw new RangeErrorConstructor('Ambiguous or nonexistent local time')
    if (candidates.length)
      return candidates[disambiguation === 'later' ? candidates.length - 1 : 0]
    const local = isoToEpochNanoseconds(fields)
    let minimum = Infinity,
      maximum = -Infinity
    for (let index = 0; index < offsets.length; index++) {
      const offset = offsets[index]
      minimum = mathMin(minimum, offset)
      maximum = mathMax(maximum, offset)
    }
    const lower = local - bigIntFrom(maximum) * second,
      upper = local - bigIntFrom(minimum) * second
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
    throw new RangeErrorConstructor('No matching instant')
  }
  return {
    offsetNanoseconds,
    possibleInstants,
    possibleInstantsFromEpochNanoseconds,
    resolve,
    transition: (instant, direction) => {
      checkInstant(instant)
      return zoneTransition(data, instant, direction)
    },
  }
}
