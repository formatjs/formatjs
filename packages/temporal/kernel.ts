import {HasOwnProperty} from '#packages/ecma262-abstract/HasOwnProperty.js'
import {
  RangeErrorConstructor,
  arrayEvery,
  arrayIncludes,
  arraySome,
  bigIntFrom,
  mathAbs,
  numberFrom,
  numberIsInteger,
  numberIsSafeInteger,
  setDataProperty,
} from '#packages/ecma262-abstract/intrinsics.js'
import {nativeTemporal} from '#packages/temporal/native.js'
// Experimental numeric kernel. No Temporal object/coercion/branding semantics.
import {
  DayFromYear,
  DaysInYear,
} from '#packages/ecma262-abstract/DateOperations.js'
import {
  TimeZoneOffset,
  TimeZoneTransition,
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

// Proposal comparison §11.1.14 steps 1–3, 5–7: Select midnight or the nearest later local time.
export function startOfTimeZoneDay(
  midnight: bigint,
  zone: TimeZoneKernel
): bigint {
  if (midnight <= -limit - day || midnight >= limit + day)
    throw new RangeErrorConstructor('Local date out of range')
  const possible = (local: bigint): bigint[] =>
    zone.possibleInstantsFromEpochNanoseconds?.(local) ??
    zone.possibleInstants(epochNanosecondsToISO(local))
  const candidates = possible(midnight)
  if (candidates.length) return candidates[0]

  const lower = midnight - day
  let upper = midnight + 3n * day
  const clipped = upper > limit
  if (clipped) upper = limit
  if (lower >= -limit && midnight + day < limit) {
    let cursor = lower
    let nearest: bigint | undefined
    // Proposal comparison §11.1.14 step 5. At midnight plus one day,
    // the offset projects to a local time within two days of midnight.
    while (true) {
      const event = zone.transition(cursor, 'next')
      if (event === null || event <= cursor || event >= upper) break
      cursor = event
      const projected = event + zone.offsetNanoseconds(event)
      if (
        projected > midnight &&
        (nearest === undefined || projected < nearest)
      ) {
        nearest = projected
        if (nearest + day < upper) upper = nearest + day
      }
    }
    // Proposal comparison §11.1.14 step 5: Exclude earlier local times beyond the scan.
    if (nearest !== undefined && (!clipped || nearest + day <= limit)) {
      const after = possible(nearest)
      if (after.length === 1) return after[0]
    }
  }

  // Preserve fallback behavior when the bounded search cannot confirm the nearest local time.
  let event: bigint | null = zone.resolve(epochNanosecondsToISO(midnight))
  while (event !== null && event >= lower) {
    if (event > -limit) {
      const before = zone.offsetNanoseconds(event - 1n),
        after = zone.offsetNanoseconds(event)
      if (
        after > before &&
        midnight >= event + before &&
        midnight < event + after
      )
        return event
    }
    event = zone.transition(event, 'previous')
  }
  throw new RangeErrorConstructor('No day boundary in instant range')
}

// Temporal comparison §11.1.2 steps 2, 3.
// Floor the epoch quotient so negative instants keep the correct remainder.
function floorDivide(value: bigint, divisor: bigint): bigint {
  const quotient = value / divisor
  return value < 0n && value % divisor !== 0n ? quotient - 1n : quotient
}

// Temporal comparison §8.5.1 step 1.
// Check inclusive Instant epoch bounds before the zone operation.
function checkInstant(value: bigint): bigint {
  // https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/instant.html#L369
  // L369: inclusive exact epoch bounds; rejection implements the predicate false result.
  if (value < -limit || value > limit)
    throw new RangeErrorConstructor('Instant out of range')
  return value
}

// Temporal comparison §5.5.4 steps 2–4 and amendment §14.6.1 steps 1–5.
// Compose exact local epoch nanoseconds and enforce the strict bounds.
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
    // Temporal comparison §4.5.9 steps 1–6.
    // Check each prepared clock component against its unit bound.
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
// Temporal comparison §11.1.2 steps 2–16.
// Project the epoch into exact Gregorian date and clock fields.
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

// Temporal comparison §3.5.9 steps 1–3.
// Add an exact day count while preserving the prepared clock.
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

// Temporal comparison §6.3.46 steps 9.a and 10.b.
// Use the packed formatter's exact transition search, including the footer handoff.
function zoneTransition(
  data: UnpackedTimeZoneData,
  instant: bigint,
  direction: 'next' | 'previous'
): bigint | null {
  return TimeZoneTransition(instant, direction, data) ?? null
}

// Temporal comparison §11.1.9 step 3 and §11.1.13 step 3.a.
// Build the offset, candidate and disambiguation operations for prepared data.
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
  // Temporal comparison §11.1.9 step 3. The packed table also covers the
  // candidate window just outside either Instant limit.
  const offsetAt = (instant: bigint): bigint =>
    bigIntFrom(
      TimeZoneOffset(numberFrom(floorDivide(instant, 1_000_000n)), data)[0]
    ) * second
  const offsetNanoseconds = (instant: bigint): bigint =>
    offsetAt(checkInstant(instant))
  // Temporal comparison §11.1.13 steps 3.a, 4.a and 5, §14.6.3 prose.
  // Collect round-tripping named-zone candidates and sort the private list.
  const possibleInstantsFromEpochNanoseconds = (local: bigint): bigint[] => {
    const candidates: bigint[] = []
    for (let index = 0; index < offsets.length; index++) {
      const offset = bigIntFrom(offsets[index]) * second
      const instant = local - offset
      if (offsetAt(instant) === offset)
        setDataProperty(
          candidates,
          `${candidates.length}`,
          checkInstant(instant)
        )
    }
    return apply(arraySort, candidates, [
      // Temporal comparison §11.1.13 step 5, §14.6.3 prose.
      // Compare the two exact candidate epochs for ascending order.
      (a: bigint, b: bigint) => (a < b ? -1 : a > b ? 1 : 0),
    ])
  }
  // Temporal comparison §11.1.13 step 3.a.
  // Project prepared ISO fields before named-zone candidate lookup.
  const possibleInstants = (fields: ISODateTime): bigint[] =>
    possibleInstantsFromEpochNanoseconds(isoToEpochNanoseconds(fields))
  // Temporal comparison §11.1.12 steps 2, 3.a, 3.b and 5.
  // Choose single or folded candidates and resolve loaded-zone gaps.
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
    const local = isoToEpochNanoseconds(fields)
    const candidates = possibleInstantsFromEpochNanoseconds(local)
    if (candidates.length === 1) return candidates[0]
    if (disambiguation === 'reject')
      throw new RangeErrorConstructor('Ambiguous or nonexistent local time')
    if (candidates.length)
      return candidates[disambiguation === 'later' ? candidates.length - 1 : 0]
    const earlier = disambiguation === 'earlier'
    const lower = local - 3n * day,
      upper = local + 3n * day
    let before: bigint | undefined
    let after: bigint | undefined
    let fallback: bigint | undefined
    let event = zoneTransition(
      data,
      lower < -limit ? -limit : lower - 1n,
      'next'
    )
    // Temporal comparison §11.1.12 steps 6–7.
    // Project nearby segment boundaries to find both nearest local times.
    while (event !== null && event <= upper) {
      if (event > -limit) {
        const oldOffset = offsetNanoseconds(event - 1n),
          newOffset = offsetNanoseconds(event)
        const end = event - 1n + oldOffset,
          start = event + newOffset
        if (end < local && (before === undefined || end > before)) before = end
        if (start > local && (after === undefined || start < after))
          after = start
        if (fallback === undefined && local > end && local < start)
          fallback = local - (earlier ? newOffset : oldOffset)
      }
      event = zoneTransition(data, event, 'next')
    }
    // Temporal comparison §11.1.12 steps 8–15.
    // Derive the shift from the actual singleton boundary candidates.
    if (before !== undefined && after !== undefined) {
      const left = possibleInstantsFromEpochNanoseconds(before)
      const right = possibleInstantsFromEpochNanoseconds(after)
      if (left.length === 1 && right.length === 1) {
        const shift = after - right[0] - (before - left[0])
        if (shift && shift >= -day && shift <= day) {
          // Temporal comparison §11.1.12 steps 16.e–16.g and 22–25.
          // Select the requested end of the shifted candidate list.
          const candidates = possibleInstantsFromEpochNanoseconds(
            local + (earlier ? -shift : shift)
          )
          if (candidates.length)
            return candidates[earlier ? 0 : candidates.length - 1]
        }
      }
    }
    // Preserve the existing gap behavior when the boundary assumptions fail.
    if (fallback !== undefined) return checkInstant(fallback)
    throw new RangeErrorConstructor('No matching instant')
  }
  return {
    offsetNanoseconds,
    possibleInstants,
    possibleInstantsFromEpochNanoseconds,
    resolve,
    // Temporal comparison §6.3.46 steps 9.a, 10.b, 11.
    // Dispatch the direction to the bounded named-zone transition search.
    transition: (instant, direction) => {
      checkInstant(instant)
      return zoneTransition(data, instant, direction)
    },
  }
}
