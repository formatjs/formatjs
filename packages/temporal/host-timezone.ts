import {steps} from '@formatjs_generated/tz/temporal-names.js'
import links from '@formatjs_generated/tz/links.js'
import primary from '@formatjs_generated/tz/primary.js'
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
> &
  Partial<Pick<TimeZoneKernel, 'transition'>>
const Constructor = globalThis.Intl?.DateTimeFormat
const parts = Constructor?.prototype.formatToParts
const nowMilliseconds = Date.now
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

export function createHostTimeZoneOffset(
  timeZone: string,
  intrinsics: {
    Constructor?: Intl.DateTimeFormatConstructor
    parts?: typeof Intl.DateTimeFormat.prototype.formatToParts
  } = {Constructor, parts}
): HostTimeZone['offsetNanoseconds'] {
  const {Constructor, parts} = intrinsics
  if (!Constructor || !parts)
    throw new RangeError(
      'Temporal requires Intl.DateTimeFormat timezone support'
    )
  const formatter = new Constructor(
    'en-US-u-nu-latn',
    Object.assign(Object.create(null), {
      timeZone,
      calendar: 'iso8601',
      numberingSystem: 'latn',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: false,
    })
  )
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
    const fields = parts.call(formatter, key * 1000)
    for (let index = 0; index < fields.length; index++) {
      const part = fields[index]
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
  return offsetNanoseconds
}

export function createHostTimeZone(timeZone: string): TimeZoneKernel {
  const offsetNanoseconds = createHostTimeZoneOffset(timeZone)
  const sampleOffsets = (local: bigint): bigint[] => {
    const result: bigint[] = []
    const samples = [clamp(local - day), clamp(local), clamp(local + day)]
    for (let index = 0; index < samples.length; index++) {
      const offset = offsetNanoseconds(samples[index])
      if (!result.includes(offset)) result.push(offset)
    }
    return result
  }
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
  const canonical =
    (links as Record<string, string>)[timeZone] ??
    (primary as Record<string, string>)[timeZone] ??
    timeZone
  // Host tzdata can contain transitions absent from our generated metadata.
  const step = BigInt(
    Math.min(steps[timeZone] ?? steps[canonical] ?? 7 * 86400, 7 * 86400)
  )
  const transitions: {
    direction: string
    first: bigint
    last: bigint
    value: bigint | null
  }[] = []
  const unchanged: {first: bigint; last: bigint; offset: bigint}[] = []
  const transition = (
    instant: bigint,
    direction: 'next' | 'previous'
  ): bigint | null => {
    check(instant)
    const known = transitions.find(
      row =>
        row.direction === direction &&
        instant >= row.first &&
        instant <= row.last
    )
    if (known) return known.value
    const next = direction === 'next'
    const floorSecond = (value: bigint) =>
      value / second - (value < 0n && value % second ? 1n : 0n)
    const earliest = -5364662400n // IANA transitions begin after 1800.
    const horizon = 3n * 366n * 86400n
    const now = floorSecond(BigInt(nowMilliseconds()) * 1000000n)
    const original = floorSecond(next ? instant : instant - 1n)
    let cursor = next ? (original < earliest ? earliest : original) : original
    const end = next ? (original > now ? original : now) + horizon : earliest
    const boundary = next
      ? end > limit / second
        ? limit / second
        : end
      : earliest
    let value: bigint | null = null
    let initial = cursor
    while (next ? cursor < boundary : cursor > boundary) {
      const observed = unchanged.find(row =>
        next
          ? row.first <= cursor && cursor < row.last
          : row.first < cursor && cursor <= row.last
      )
      let probe = observed
        ? next
          ? observed.last
          : observed.first
        : cursor + (next ? step : -step)
      if (next ? probe > boundary : probe < boundary) probe = boundary
      const offset = offsetNanoseconds(cursor * second)
      if (offsetNanoseconds(probe * second) !== offset) {
        let left = next ? cursor : probe
        let right = next ? probe : cursor
        const before = offsetNanoseconds(left * second)
        while (right - left > 1n) {
          const middle = (left + right) >> 1n
          if (offsetNanoseconds(middle * second) === before) left = middle
          else right = middle
        }
        value = right * second
        break
      }
      let first = next ? cursor : probe
      let last = next ? probe : cursor
      for (let index = unchanged.length - 1; index >= 0; index--) {
        const row = unchanged[index]
        if (row.offset === offset && row.first <= last && first <= row.last) {
          if (row.first < first) first = row.first
          if (row.last > last) last = row.last
          unchanged.splice(index, 1)
        }
      }
      if (unchanged.length >= 64) unchanged.shift()
      unchanged.push({first, last, offset})
      cursor = probe
      // Future host rules repeat annually or settle at a fixed offset. Search
      // nearby years first, then resume the finite historical record.
      if (!next && initial > now + horizon && initial - cursor >= horizon) {
        cursor = now + horizon
        initial = cursor
      }
    }
    if (transitions.length >= 64) transitions.shift()
    transitions.push({
      direction,
      first: next ? instant : value === null ? -limit : value + 1n,
      last: next ? (value === null ? instant : value - 1n) : instant,
      value,
    })
    return value
  }
  return {offsetNanoseconds, possibleInstants, resolve, transition}
}
