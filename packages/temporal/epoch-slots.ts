import {HasOwnProperty} from '#packages/ecma262-abstract/HasOwnProperty.js'
import {UTCOffsetNanoseconds} from '#packages/ecma262-abstract/UTCOffsetNanoseconds.js'
import {
  RangeErrorConstructor,
  TypeErrorConstructor,
  arrayIncludes,
  numberIsInteger,
} from '#packages/ecma262-abstract/intrinsics.js'
import {calendarIds} from '#packages/temporal/calendar-ids.js'
import links from '@formatjs_generated/tz/links.js'
import primary from '@formatjs_generated/tz/primary.js'
import names from '@formatjs_generated/tz/temporal-names.js'

interface ZonedEpoch {
  readonly epochNanoseconds: bigint
  readonly timeZone: string
  readonly calendar: string
}

const createObject = Object.create
const freeze = Object.freeze
const WeakMapConstructor = WeakMap
const getSlot = Function.prototype.call.bind(WeakMap.prototype.get) as <T>(
  map: WeakMap<object, T>,
  value: object
) => T | undefined
const setSlot = Function.prototype.call.bind(WeakMap.prototype.set) as <T>(
  map: WeakMap<object, T>,
  value: object,
  slot: T
) => void
let instants: WeakMap<object, bigint> | undefined
let zonedDates: WeakMap<object, ZonedEpoch> | undefined
let plainDates: WeakMap<object, PlainEpoch> | undefined

const limit = 8_640_000_000_000_000_000_000n

// Temporal comparison §8.4.1 and §8.5.1 step 1. Check inclusive Instant bounds.
// https://tc39.es/proposal-temporal/#sec-temporal-instant-range
export function validateInstant(value: bigint): bigint {
  if (value < -limit || value > limit)
    throw new RangeErrorConstructor('Instant out of range')
  return value
}

// Temporal comparison §8.5.2 step 1. Check the prepared epoch before allocation.
function validateEpoch(value: unknown): bigint {
  if (typeof value !== 'bigint')
    throw new TypeErrorConstructor('Epoch nanoseconds must be a BigInt')
  return validateInstant(value)
}

// Temporal comparison §8.5.2 steps 3–4: allocate and initialize a fresh Instant.
// https://tc39.es/proposal-temporal/#sec-temporal-createtemporalinstant
export function allocateInstant(
  prototype: object | null,
  value: unknown
): object {
  const epoch = validateEpoch(value)
  const result = createObject(prototype)
  setSlot((instants ??= new WeakMapConstructor()), result, epoch)
  return result
}

// Temporal comparison §8.5.3 step 1.a. Read the Instant slot without public Gets.
export function getSharedInstantSlot(value: object): bigint | undefined {
  return instants && getSlot(instants, value)
}

export type DaySlotKind = 'date' | 'year-month' | 'month-day'

interface DayEpoch {
  readonly kind: DaySlotKind
  readonly epochDay: number
  readonly calendar: string
}

interface DateTimeEpoch {
  readonly kind: 'date-time'
  readonly epochNanoseconds: bigint
  readonly calendar: string
}

type PlainEpoch = DayEpoch | DateTimeEpoch

// Temporal comparison §3.5.3 steps 3–5, §9.5.5 steps 3–5 and §10.5.2 steps 3–5.
// Allocate a prepared ISO date slot.
// https://tc39.es/proposal-temporal/#sec-temporal-createtemporaldate
export function allocateSharedDay(
  prototype: object | null,
  kind: DaySlotKind,
  epochDay: unknown,
  calendar: unknown
): object {
  if (kind !== 'date' && kind !== 'year-month' && kind !== 'month-day')
    throw new TypeErrorConstructor('Invalid Temporal date kind')
  if (typeof epochDay !== 'number' || typeof calendar !== 'string')
    throw new TypeErrorConstructor('Invalid Temporal date fields')
  // Temporal comparison §§3.5.12, 9.5.3: short year-months span two edge months.
  const yearMonth = kind === 'year-month'
  if (
    !numberIsInteger(epochDay) ||
    epochDay < (yearMonth ? -100000019 : -100000001) ||
    epochDay > (yearMonth ? 100000017 : 100000000) ||
    !arrayIncludes(calendarIds, calendar)
  )
    throw new RangeErrorConstructor('Invalid Temporal date fields')
  const object = createObject(prototype)
  setSlot(
    (plainDates ??= new WeakMapConstructor()),
    object,
    freeze({__proto__: null, kind, epochDay, calendar})
  )
  return object
}

// Temporal comparison §5.5.8 steps 3–5. Allocate the prepared local epoch.
// https://tc39.es/proposal-temporal/#sec-temporal-createtemporaldatetime
export function allocateSharedDateTime(
  prototype: object | null,
  epochNanoseconds: unknown,
  calendar: unknown
): object {
  if (typeof epochNanoseconds !== 'bigint' || typeof calendar !== 'string')
    throw new TypeErrorConstructor('Invalid Temporal date-time fields')
  const bound = 8_640_000_086_400_000_000_000n
  if (
    epochNanoseconds <= -bound ||
    epochNanoseconds >= bound ||
    !arrayIncludes(calendarIds, calendar)
  )
    throw new RangeErrorConstructor('Invalid Temporal date-time fields')
  const object = createObject(prototype)
  setSlot(
    (plainDates ??= new WeakMapConstructor()),
    object,
    freeze({
      __proto__: null,
      kind: 'date-time' as const,
      epochNanoseconds,
      calendar,
    })
  )
  return object
}

// Temporal comparison §§12.3.10–11 step 1. Identify an initialized date slot.
export function getSharedDaySlot(
  object: object,
  kind: DaySlotKind
): DayEpoch | undefined {
  const slot = plainDates && getSlot(plainDates, object)
  return slot?.kind === kind ? slot : undefined
}

// Temporal comparison §§12.3.10–11 step 1. Identify an initialized date-time slot.
export function getSharedDateTimeSlot(
  object: object
): DateTimeEpoch | undefined {
  const slot = plainDates && getSlot(plainDates, object)
  return slot?.kind === 'date-time' ? slot : undefined
}

interface TimeZoneMetadata {
  readonly names: readonly string[]
  readonly primary: Readonly<Partial<Record<string, string>>>
  readonly links: Readonly<Partial<Record<string, string>>>
}

let metadata: TimeZoneMetadata | undefined

// Temporal comparison §11.1.1 step 1. Supply the named zone records.
export function timeZoneMetadata(): TimeZoneMetadata {
  return (metadata ??= freeze({
    __proto__: null,
    names: freeze(names),
    primary: freeze(primary),
    links: freeze(links),
  }))
}

let timeZoneNames: Record<string, true> | undefined
// Temporal comparison §11.1.8 steps 5 and 7–9. Check a prepared zone identifier.
function supportedTimeZone(value: string): boolean {
  if (
    value.length === 6 &&
    value[3] === ':' &&
    value !== '-00:00' &&
    UTCOffsetNanoseconds(value, true) !== undefined
  )
    return true
  if (!timeZoneNames) {
    const lookup = createObject(null) as Record<string, true>
    for (let i = 0; i < names.length; i++) lookup[names[i]] = true
    timeZoneNames = lookup
  }
  return (
    value === 'UTC' ||
    HasOwnProperty(primary, value) ||
    HasOwnProperty(links, value) ||
    HasOwnProperty(timeZoneNames, value)
  )
}

// Temporal comparison §6.5.3 steps 3–6: allocate and initialize a fresh ZonedDateTime.
// https://tc39.es/proposal-temporal/#sec-temporal-createtemporalzoneddatetime
export function allocateZonedDateTime(
  prototype: object | null,
  value: unknown,
  timeZone: unknown,
  calendar: unknown
): object {
  const epochNanoseconds = validateEpoch(value)
  if (typeof timeZone !== 'string' || typeof calendar !== 'string')
    throw new TypeErrorConstructor('Timezone and calendar must be strings')
  if (!supportedTimeZone(timeZone) || !arrayIncludes(calendarIds, calendar))
    throw new RangeErrorConstructor('Invalid timezone or calendar identifier')
  const result = createObject(prototype)
  setSlot(
    (zonedDates ??= new WeakMapConstructor()),
    result,
    freeze({__proto__: null, epochNanoseconds, timeZone, calendar})
  )
  return result
}

// Temporal comparison §8.5.3 step 1.a. Read the zoned epoch without public Gets.
export function getSharedZonedSlot(value: object): ZonedEpoch | undefined {
  return zonedDates && getSlot(zonedDates, value)
}
