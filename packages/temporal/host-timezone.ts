import {
  isoToEpochNanoseconds,
  type ISODateTime,
  type Disambiguation,
  type TimeZoneKernel,
} from '#packages/temporal/kernel.js'
import {DateFromTime} from '#packages/ecma262-abstract/DateOperations.js'

export type HostTimeZone = Pick<
  TimeZoneKernel,
  'offsetNanoseconds' | 'possibleInstants' | 'resolve'
>
const Constructor = globalThis.Intl?.DateTimeFormat
const parts = Constructor?.prototype.formatToParts
const second = 1000000000n
const day = 86400n * second
const limit = 100000000n * day
function check(instant: bigint): bigint {
  if (instant < -limit || instant > limit)
    throw new RangeError('Instant out of range')
  return instant
}
const clamp = (instant: bigint): bigint =>
  instant < -limit ? -limit : instant > limit ? limit : instant

// Intl exposes offsets, not transition enumeration.
export function createHostTimeZone(timeZone: string): HostTimeZone {
  if (!Constructor || !parts)
    throw new RangeError(
      'Temporal requires Intl.DateTimeFormat timezone support'
    )
  const formatter = new Constructor('en-US-u-nu-latn', {
    timeZone,
    calendar: 'iso8601',
    numberingSystem: 'latn',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false,
  })
  const offsets = new Map<number, bigint>()
  const offsetNanoseconds = (instant: bigint): bigint => {
    check(instant)
    const epochSecond =
        instant / second - (instant < 0n && instant % second !== 0n ? 1n : 0n),
      key = Number(epochSecond),
      cached = offsets.get(key)
    if (cached !== undefined) return cached
    let date = -1,
      hour = -1,
      minute = -1,
      seconds = -1
    for (const part of parts.call(formatter, key * 1000)) {
      if (part.type === 'day') date = Number(part.value)
      else if (part.type === 'hour') hour = Number(part.value)
      else if (part.type === 'minute') minute = Number(part.value)
      else if (part.type === 'second') seconds = Number(part.value)
    }
    if (
      !(
        date >= 1 &&
        date <= 31 &&
        hour >= 0 &&
        hour <= 24 &&
        minute >= 0 &&
        minute < 60 &&
        seconds >= 0 &&
        seconds < 60
      )
    )
      throw new RangeError('Unsupported host timezone fields')
    const utcDate = DateFromTime(key * 1000),
      nextDate = date === utcDate + 1 || (date === 1 && utcDate >= 28),
      previousDate = date === utcDate - 1 || (utcDate === 1 && date >= 28)
    if (date !== utcDate && !nextDate && !previousDate)
      throw new RangeError('Unsupported host timezone calendar')
    const difference = date === utcDate ? 0 : nextDate ? 1 : -1,
      utcSeconds = Number(((epochSecond % 86400n) + 86400n) % 86400n),
      offsetSeconds =
        difference * 86400 +
        (hour % 24) * 3600 +
        minute * 60 +
        seconds -
        utcSeconds
    if (Math.abs(offsetSeconds) >= 86400)
      throw new RangeError('Invalid host timezone offset')
    const offset = BigInt(offsetSeconds) * second
    if (offsets.size >= 64) offsets.delete(offsets.keys().next().value!)
    offsets.set(key, offset)
    return offset
  }
  const sampleOffsets = (local: bigint): bigint[] => [
    ...new Set([
      offsetNanoseconds(clamp(local - day)),
      offsetNanoseconds(clamp(local)),
      offsetNanoseconds(clamp(local + day)),
    ]),
  ]
  const candidatesFor = (local: bigint): bigint[] => {
    const candidates = sampleOffsets(local)
      .map(offset => local - offset)
      .filter(
        instant =>
          instant >= -limit &&
          instant <= limit &&
          instant + offsetNanoseconds(instant) === local
      )
    return candidates.sort((one, two) => (one < two ? -1 : one > two ? 1 : 0))
  }
  const possibleInstants = (fields: ISODateTime): bigint[] =>
    candidatesFor(isoToEpochNanoseconds(fields))
  const resolve = (
    fields: ISODateTime,
    disambiguation: Disambiguation = 'compatible'
  ): bigint => {
    if (!['compatible', 'earlier', 'later', 'reject'].includes(disambiguation))
      throw new RangeError('Invalid disambiguation')
    const local = isoToEpochNanoseconds(fields),
      candidates = candidatesFor(local)
    if (candidates.length === 1) return candidates[0]
    if (disambiguation === 'reject')
      throw new RangeError('Ambiguous or nonexistent local time')
    if (candidates.length)
      return candidates[disambiguation === 'later' ? candidates.length - 1 : 0]
    const before = offsetNanoseconds(clamp(local - day)),
      after = offsetNanoseconds(clamp(local + day))
    if (after <= before) throw new RangeError('No matching instant')
    return check(local - (disambiguation === 'earlier' ? after : before))
  }
  return {offsetNanoseconds, possibleInstants, resolve}
}
