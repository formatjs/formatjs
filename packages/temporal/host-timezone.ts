import {
  RangeErrorConstructor,
  arrayIncludes,
  bigIntFrom,
  mathAbs,
  mathMin,
  numberFrom,
  numberIsSafeInteger,
  setDataProperty,
} from '#packages/ecma262-abstract/intrinsics.js'
import {
  lastExplicitTransition,
  steps,
} from '@formatjs_generated/tz/temporal-names.js'
import {
  hasLegacyTimeZoneProvider,
  timeZoneMetadata,
} from '#packages/temporal/native.js'
import {
  createTimeZone,
  isoToEpochNanoseconds,
  type ISODateTime,
  type Disambiguation,
  type TimeZoneKernel,
} from '#packages/temporal/kernel.js'
import type {UnpackedTimeZoneData} from '#packages/ecma402-abstract/types/date-time.js'
import {DateFromTime} from '#packages/ecma262-abstract/DateOperations.js'
import {HasOwnProperty} from '#packages/ecma262-abstract/HasOwnProperty.js'

export type HostTimeZone = Pick<
  TimeZoneKernel,
  'offsetNanoseconds' | 'possibleInstants' | 'resolve'
> &
  Partial<Pick<TimeZoneKernel, 'transition'>>
const apply = Reflect.apply
const getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor
const arraySort = Array.prototype.sort
const isArray = Array.isArray
const arrayFind = Array.prototype.find
const arrayCopyWithin = Array.prototype.copyWithin
const arrayPop = Array.prototype.pop
const arrayShift = Array.prototype.shift
const MapConstructor = Map
const mapGet = MapConstructor.prototype.get
const mapSet = MapConstructor.prototype.set
const mapDelete = MapConstructor.prototype.delete
const mapClear = MapConstructor.prototype.clear
const mapKeys = MapConstructor.prototype.keys
const mapSize = Object.getOwnPropertyDescriptor(
  MapConstructor.prototype,
  'size'
)!.get! as () => number
const mapIteratorNext = Object.getPrototypeOf(new MapConstructor().keys())
  .next as () => IteratorResult<number>
const Constructor = globalThis.Intl?.DateTimeFormat
const hostParts = Constructor?.prototype.formatToParts
const hostResolvedOptions = Constructor?.prototype.resolvedOptions
const queryTemporalTimeZoneKey = Symbol.for(
  '@formatjs/intl-datetimeformat/queryTemporalTimeZone'
)
const timeZoneDataGenerationKey = Symbol.for(
  '@formatjs/intl-datetimeformat/timeZoneDataGeneration'
)
type OwnedTimeZoneQuery = (
  this: Intl.DateTimeFormat,
  local: bigint,
  direction?: 'earlier' | 'later'
) => bigint[] | bigint | undefined
// ECMA-262 §7.3.12 steps 1–3: A capability descriptor must have its own value.
function ownDataValue(object: object | undefined, key: PropertyKey): unknown {
  const descriptor = object && getOwnPropertyDescriptor(object, key)
  if (!descriptor || !HasOwnProperty(descriptor, 'value')) return undefined
  return descriptor.value
}

function hostTimeZoneCapability(
  method: object | undefined,
  key: symbol
): unknown {
  // ECMA-262 §7.2.3 step 2: A capability must be callable.
  const value = ownDataValue(method, key)
  return typeof value === 'function' ? value : undefined
}

const checkHostTemporalCandidates = hostTimeZoneCapability(
  hostParts,
  Symbol.for('@formatjs/intl-datetimeformat/checkTemporalCandidates')
) as OwnedTimeZoneQuery | undefined
const nearestHostLocalAfter = checkHostTemporalCandidates
  ? (hostTimeZoneCapability(
      hostParts,
      Symbol.for('@formatjs/intl-datetimeformat/nearestTemporalLocalAfter')
    ) as
      | ((this: Intl.DateTimeFormat, local: bigint) => bigint | undefined)
      | undefined)
  : undefined
const nowMilliseconds = Date.now
const second = 1000000000n
const day = 86400n * second
const limit = 100000000n * day
// Proposal comparison §8.5.1 step 1: enforce inclusive Instant bounds before host calls.
function check(instant: bigint): bigint {
  if (instant < -limit || instant > limit)
    throw new RangeErrorConstructor('Instant out of range')
  return instant
}
// Proposal comparison §11.1.13 step 3.a: keep private offset probes within Instant bounds.
const clamp = (instant: bigint): bigint =>
  instant < -limit ? -limit : instant > limit ? limit : instant

type HostTimeZoneIntrinsics = {
  Constructor?: Intl.DateTimeFormatConstructor
  parts?: typeof Intl.DateTimeFormat.prototype.formatToParts
}

function legacyTimeZoneKernel(
  constructor: Intl.DateTimeFormatConstructor,
  formatter: Intl.DateTimeFormat
): (() => TimeZoneKernel | undefined) | undefined {
  if (
    !hostResolvedOptions ||
    checkHostTemporalCandidates ||
    ownDataValue(constructor, 'polyfilled') !== true ||
    typeof ownDataValue(constructor, '__addTZData') !== 'function'
  )
    return undefined
  const name = apply(hostResolvedOptions, formatter, []).timeZone
  let previous: unknown
  let kernel: TimeZoneKernel | undefined
  return () => {
    const table = ownDataValue(constructor, 'tzData')
    const rows =
      typeof table === 'object' && table !== null
        ? ownDataValue(table, name)
        : undefined
    if (rows === previous) return kernel
    previous = rows
    kernel = undefined
    // Older FormatJS builds publish explicit rows with a -Infinity sentinel.
    if (
      !isArray(rows) ||
      !rows.length ||
      getOwnPropertyDescriptor(rows, 'future')
    )
      return undefined
    let last = -Infinity
    for (let index = 0; index < rows.length; index++) {
      const row = ownDataValue(rows, index)
      if (!isArray(row)) return undefined
      const start = ownDataValue(row, 0)
      const offset = ownDataValue(row, 2)
      if (
        typeof start !== 'number' ||
        (index === 0
          ? start !== -Infinity
          : !numberIsSafeInteger(start) || start <= last) ||
        typeof offset !== 'number' ||
        !numberIsSafeInteger(offset) ||
        mathAbs(offset) >= 86400
      )
        return undefined
      last = start
    }
    // §11.1.13 steps 3.a and 4.a need every candidate, including raw epochs
    // outside the Instant range. Reuse the exact resolver for exposed rows.
    // https://tc39.es/proposal-temporal/#sec-temporal-getpossibleepochnanoseconds
    return (kernel = createTimeZone(rows as UnpackedTimeZoneData))
  }
}

// Proposal comparison §11.1.9 step 3: prepare the host Intl formatter for named offsets.
function createHostTimeZoneProvider(
  timeZone: string,
  intrinsics: HostTimeZoneIntrinsics = {Constructor, parts: hostParts}
): {
  offsetNanoseconds: HostTimeZone['offsetNanoseconds']
  offsetAt: HostTimeZone['offsetNanoseconds']
  beginOperation(): boolean
  legacyKernel?: () => TimeZoneKernel | undefined
  ownedCandidates?: OmitThisParameter<OwnedTimeZoneQuery>
  nearestLocalAfter?: TimeZoneKernel['nearestLocalAfter']
  dataGeneration?: () => object
  ownedTransition?: (
    instant: bigint,
    direction: 'next' | 'previous'
  ) => bigint | null | undefined
} {
  const {Constructor, parts} = intrinsics
  if (!Constructor || !parts)
    throw new RangeErrorConstructor(
      'Temporal requires Intl.DateTimeFormat timezone support'
    )
  const formatter = new Constructor('en-US-u-nu-latn', {
    __proto__: null,
    timeZone,
    calendar: 'iso8601',
    numberingSystem: 'latn',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false,
  } as Intl.DateTimeFormatOptions)
  // Proposal comparison §11.1.9 step3: named offset memoization stays private.
  // https://tc39.es/proposal-temporal/#sec-temporal-getoffsetnanosecondsfor
  const offsets = new MapConstructor<number, bigint>()
  const dataGeneration = hostTimeZoneCapability(
    parts,
    timeZoneDataGenerationKey
  ) as (() => object) | undefined
  const queryTemporalTimeZone = hostTimeZoneCapability(
    parts,
    queryTemporalTimeZoneKey
  ) as
    | ((
        this: Intl.DateTimeFormat,
        instant: bigint,
        direction?: 'next' | 'previous'
      ) => bigint | null | undefined)
    | undefined
  // Proposal comparison §11.1.9 step 3: Read legacy timezone data afresh for each operation.
  const beginOperation = (): boolean => {
    if (dataGeneration || !hasLegacyTimeZoneProvider(Constructor, parts))
      return false
    apply(mapClear, offsets, [])
    return true
  }
  let offsetGeneration: object | undefined
  const offsetNanoseconds = (instant: bigint): bigint => {
    // ECMA-262 §21.4.1.21: Return the named zone's UTC offset in nanoseconds.
    // Proposal comparison §11.1.9 step 3: decode host ISO clock fields into offset nanoseconds.
    check(instant)
    if (queryTemporalTimeZone) {
      const owned = apply(queryTemporalTimeZone, formatter, [instant])
      if (typeof owned === 'bigint') return owned
    }
    // Proposal comparison §11.1.9 step 3: expire offsets when the data changes.
    if (dataGeneration) {
      const generation = dataGeneration()
      if (generation !== offsetGeneration) {
        apply(mapClear, offsets, [])
        offsetGeneration = generation
      }
    }
    const epochSecond =
        instant / second - (instant < 0n && instant % second !== 0n ? 1n : 0n),
      key = numberFrom(epochSecond),
      cached = apply(mapGet, offsets, [key]) as bigint | undefined
    if (cached !== undefined) return cached
    let date = -1,
      hour = -1,
      minute = -1,
      seconds = -1
    const fields = apply(parts, formatter, [
      key * 1000,
    ]) as Intl.DateTimeFormatPart[]
    for (let index = 0; index < fields.length; index++) {
      const part = fields[index]
      if (part.type === 'day') date = numberFrom(part.value)
      else if (part.type === 'hour') hour = numberFrom(part.value)
      else if (part.type === 'minute') minute = numberFrom(part.value)
      else if (part.type === 'second') seconds = numberFrom(part.value)
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
      throw new RangeErrorConstructor('Unsupported host timezone fields')
    const utcDate = DateFromTime(key * 1000),
      nextDate = date === utcDate + 1 || (date === 1 && utcDate >= 28),
      previousDate = date === utcDate - 1 || (utcDate === 1 && date >= 28)
    if (date !== utcDate && !nextDate && !previousDate)
      throw new RangeErrorConstructor('Unsupported host timezone calendar')
    const difference = date === utcDate ? 0 : nextDate ? 1 : -1,
      utcSeconds = numberFrom(((epochSecond % 86400n) + 86400n) % 86400n),
      offsetSeconds =
        difference * 86400 +
        (hour % 24) * 3600 +
        minute * 60 +
        seconds -
        utcSeconds
    if (mathAbs(offsetSeconds) >= 86400)
      throw new RangeErrorConstructor('Invalid host timezone offset')
    const offset = bigIntFrom(offsetSeconds) * second
    if (apply(mapSize, offsets, []) >= 64) {
      const oldest = apply(
        mapIteratorNext,
        apply(mapKeys, offsets, []),
        []
      ).value
      apply(mapDelete, offsets, [oldest])
    }
    apply(mapSet, offsets, [key, offset])
    return offset
  }
  return {
    offsetNanoseconds,
    legacyKernel:
      parts === hostParts
        ? legacyTimeZoneKernel(Constructor, formatter)
        : undefined,
    offsetAt: instant => {
      beginOperation()
      return offsetNanoseconds(instant)
    },
    beginOperation,
    dataGeneration,
    nearestLocalAfter:
      parts === hostParts && nearestHostLocalAfter
        ? local => apply(nearestHostLocalAfter, formatter, [local])
        : undefined,
    ownedTransition: queryTemporalTimeZone
      ? (instant, direction) =>
          apply(queryTemporalTimeZone, formatter, [instant, direction])
      : undefined,
    ownedCandidates:
      parts === hostParts && checkHostTemporalCandidates
        ? (local, direction) =>
            apply(checkHostTemporalCandidates, formatter, [local, direction])
        : undefined,
  }
}

// Proposal comparison §11.1.9 step 3: Expose the installed offset reader.
export function createHostTimeZoneOffset(
  timeZone: string,
  intrinsics?: HostTimeZoneIntrinsics
): HostTimeZone['offsetNanoseconds'] {
  return createHostTimeZoneProvider(timeZone, intrinsics).offsetAt
}

export function createHostTimeZone(timeZone: string): TimeZoneKernel {
  const {
    offsetNanoseconds,
    offsetAt,
    beginOperation,
    legacyKernel,
    ownedCandidates,
    nearestLocalAfter,
    ownedTransition,
    dataGeneration,
  } = createHostTimeZoneProvider(timeZone)

  // ECMA-262 preview §22.2.15 steps 3.b and 4.a use sorted, bounded named-zone candidates.
  // https://tc39.es/ecma262/pr/3966/#sec-getpossibleepochnanoseconds
  const candidatesFor = (local: bigint): bigint[] => {
    const query = ownedCandidates?.(local)
    const owned = typeof query === 'bigint' ? undefined : query
    const candidates = owned ?? []
    if (!owned) {
      // Host offsets are subday. These probes cover both offsets when adjacent
      // transitions are more than two days apart. At Instant limits, this also
      // assumes a constant offset across each clipped window.
      const before = offsetNanoseconds(clamp(local - day)),
        middle = offsetNanoseconds(clamp(local)),
        after = offsetNanoseconds(clamp(local + day))
      for (let index = 0; index < 3; index++) {
        const offset = index === 0 ? before : index === 1 ? middle : after
        if (
          (index === 1 && offset === before) ||
          (index === 2 && (offset === before || offset === middle))
        )
          continue
        const instant = local - offset
        if (
          instant >= -limit &&
          instant <= limit &&
          instant + offsetNanoseconds(instant) === local
        ) {
          // Proposal comparison §11.1.13 step 3.a: Append to the private candidate List.
          setDataProperty(candidates, `${candidates.length}`, instant)
        }
      }
    }
    return apply(arraySort, candidates, [
      // Proposal comparison §11.1.13 step 3.a: sort collected candidates by epoch nanoseconds.
      (one: bigint, two: bigint) => (one < two ? -1 : one > two ? 1 : 0),
    ])
  }
  const possibleInstantsFromEpochNanoseconds = (local: bigint): bigint[] => {
    const legacy = legacyKernel?.()
    if (legacy) return legacy.possibleInstantsFromEpochNanoseconds!(local)
    beginOperation()
    return candidatesFor(local)
  }
  const possibleInstants = (fields: ISODateTime): bigint[] =>
    // Proposal comparison §11.1.13 step 3.a: pass the ISO local time as epoch nanoseconds.
    possibleInstantsFromEpochNanoseconds(isoToEpochNanoseconds(fields))
  // Proposal comparison §11.1.12 steps 2, 3.a, 3.b, 3.d and 5: Select observed candidates by disambiguation.
  const resolve = (
    fields: ISODateTime,
    disambiguation: Disambiguation = 'compatible'
  ): bigint => {
    const legacy = legacyKernel?.()
    if (legacy) return legacy.resolve(fields, disambiguation)
    if (
      !arrayIncludes(
        ['compatible', 'earlier', 'later', 'reject'],
        disambiguation
      )
    )
      throw new RangeErrorConstructor('Invalid disambiguation')
    beginOperation()
    const local = isoToEpochNanoseconds(fields),
      candidates = candidatesFor(local)
    if (candidates.length === 1) return candidates[0]
    if (disambiguation === 'reject')
      throw new RangeErrorConstructor('Ambiguous or nonexistent local time')
    if (candidates.length)
      return candidates[disambiguation === 'later' ? candidates.length - 1 : 0]
    const earlier = disambiguation === 'earlier'
    // ECMA-262 preview §22.2.14 steps 6–7 supply the epochs on either side of a gap.
    // https://tc39.es/ecma262/pr/3966/#sec-disambiguatepossibleepochnanoseconds
    // Owned providers resolve the shifted local time using the exact transitions.
    const exact = ownedCandidates?.(local, earlier ? 'earlier' : 'later')
    if (typeof exact === 'bigint') return exact
    const before = offsetNanoseconds(clamp(local - day)),
      after = offsetNanoseconds(clamp(local + day))
    const shift = after - before
    if (shift <= 0n) throw new RangeErrorConstructor('No matching instant')
    const fallback = check(local - (earlier ? after : before))
    // Proposal comparison §11.1.12 steps 16.e–g and 22–25: Recheck sampled candidates at the shifted clock.
    if (!ownedCandidates && shift <= day) {
      const shifted = candidatesFor(local + (earlier ? -shift : shift))
      if (shifted.length) return shifted[earlier ? 0 : shifted.length - 1]
    }
    return fallback
  }
  const {links, primary} = timeZoneMetadata()
  const canonical = links[timeZone] ?? primary[timeZone] ?? timeZone
  // Host tzdata can contain transitions absent from our generated metadata.
  const step = bigIntFrom(
    mathMin(steps[timeZone] ?? steps[canonical] ?? 7 * 86400, 7 * 86400)
  )
  // Proposal comparison §6.3.46 steps9.a,10.b: private transition search caches.
  // https://tc39.es/proposal-temporal/#sec-temporal.zoneddatetime.prototype.gettimezonetransition
  const transitions: {
    direction: string
    first: bigint
    last: bigint
    value: bigint | null
  }[] = []
  const unchanged: {first: bigint; last: bigint; offset: bigint}[] = []
  let transitionGeneration: object | undefined
  const transition = (
    instant: bigint,
    direction: 'next' | 'previous'
  ): bigint | null => {
    const legacy = legacyKernel?.()
    if (legacy) return legacy.transition(instant, direction)
    check(instant)
    // Proposal comparison §6.3.46 steps 9.a and 10.b: use exact owned boundaries.
    const owned = ownedTransition?.(instant, direction)
    if (owned !== undefined) return owned
    // Proposal comparison §6.3.46 steps 9.a and 10.b: expire transitions when the data changes.
    const generation = dataGeneration?.()
    if (beginOperation() || generation !== transitionGeneration) {
      transitions.length = 0
      unchanged.length = 0
      transitionGeneration = generation
    }
    const known = apply(arrayFind, transitions, [
      (row: (typeof transitions)[number]) =>
        // Proposal comparison §6.3.46 steps 9.a, 10.b: reuse a cached result for this direction and instant.
        row.direction === direction &&
        instant >= row.first &&
        instant <= row.last,
    ]) as (typeof transitions)[number] | undefined
    if (known) return known.value
    const next = direction === 'next'
    const floorSecond = (value: bigint) =>
      // Proposal comparison §6.3.46 steps 9.a, 10.b: floor negative and positive probes to whole seconds.
      value / second - (value < 0n && value % second ? 1n : 0n)
    // Proposal comparison §6.3.46 steps 9.a and 10.b: Probe the second before the 1800 floor.
    const earliest = -5_364_662_400n - 1n
    const horizon = 3n * 366n * 86400n
    const now = floorSecond(bigIntFrom(nowMilliseconds()) * 1000000n)
    const lastExplicit = bigIntFrom(lastExplicitTransition)
    // Proposal comparison §6.3.46 steps 9.a and 10.b: keep future calendar
    // exceptions in the search before skipping into the recurring tail.
    const knownEnd = now > lastExplicit ? now : lastExplicit
    const historyEnd = knownEnd + horizon
    // ECMA-262 preview §22.2.4: a previous transition must precede the input, so probe from one nanosecond earlier.
    // https://tc39.es/ecma262/pr/3966/#sec-getnamedtimezoneprevioustransition
    const original = floorSecond(next ? instant : instant - 1n)
    let cursor = next ? (original < earliest ? earliest : original) : original
    const end = next
      ? (original > knownEnd ? original : knownEnd) + horizon
      : earliest
    const boundary = next
      ? end > limit / second
        ? limit / second
        : end
      : earliest
    let value: bigint | null = null
    while (next ? cursor < boundary : cursor > boundary) {
      const observed = apply(arrayFind, unchanged, [
        (row: (typeof unchanged)[number]) =>
          // Proposal comparison §6.3.46 steps 9.a, 10.b: test the directional cached span.
          next
            ? row.first <= cursor && cursor < row.last
            : row.first < cursor && cursor <= row.last,
      ]) as (typeof unchanged)[number] | undefined
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
          // Proposal comparison §6.3.46 steps9.a,10.b: discard private cache row.
          // copyWithin/pop avoid ArraySpeciesCreate on this private List.
          apply(arrayCopyWithin, unchanged, [index, index + 1])
          apply(arrayPop, unchanged, [])
        }
      }
      if (unchanged.length >= 64) apply(arrayShift, unchanged, [])
      // Proposal comparison §6.3.46 steps 9.a and 10.b: store a private search interval.
      setDataProperty(unchanged, unchanged.length, {first, last, offset})
      cursor = probe
      // Future host rules repeat annually or settle at a fixed offset. Search
      // nearby years first, then resume the finite historical record.
      if (!next && cursor > historyEnd && original - cursor >= horizon)
        cursor = historyEnd
    }
    if (transitions.length >= 64) apply(arrayShift, transitions, [])
    // Proposal comparison §6.3.46 steps 9.a and 10.b: store the checked result privately.
    setDataProperty(transitions, transitions.length, {
      direction,
      first: next ? instant : value === null ? -limit : value + 1n,
      last: next ? (value === null ? instant : value - 1n) : instant,
      value,
    })
    return value
  }
  return {
    offsetNanoseconds: instant =>
      legacyKernel?.()?.offsetNanoseconds(instant) ?? offsetAt(instant),
    possibleInstants,
    possibleInstantsFromEpochNanoseconds,
    nearestLocalAfter: local =>
      (legacyKernel?.()?.nearestLocalAfter ?? nearestLocalAfter)?.(local),
    resolve,
    transition,
  }
}
