import {createInstant, type InstantObject} from '#packages/temporal/instant.js'
import {
  createPlainDate,
  type PlainDateObject,
} from '#packages/temporal/plain-date.js'
import {
  createPlainDateTime,
  type PlainDateTimeObject,
} from '#packages/temporal/plain-date-time.js'
import {
  createPlainTime,
  type PlainTimeObject,
} from '#packages/temporal/plain-time.js'
import {
  createZonedDateTime,
  type ZonedDateTimeObject,
} from '#packages/temporal/zoned-date-time.js'
import {
  timeZoneIdentifier,
  zonedKernel,
  primaryTimeZoneIdentifier,
} from '#packages/temporal/zones.js'
import {epochDayOf, timeOf} from '#packages/temporal/date-core.js'

export interface NowObject {
  timeZoneId(): string
  instant(): InstantObject
  plainDateTimeISO(timeZone?: unknown): PlainDateTimeObject
  zonedDateTimeISO(timeZone?: unknown): ZonedDateTimeObject
  plainDateISO(timeZone?: unknown): PlainDateObject
  plainTimeISO(timeZone?: unknown): PlainTimeObject
}
export interface SystemClock {
  epochNanoseconds(): bigint
  timeZoneId(): string
}
const limit = 8_640_000_000_000_000_000_000n
export function createNow(clock: SystemClock): NowObject {
  // Step references: https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/temporal.html
  function instant(): bigint {
    // HostSystemUTCEpochNanoseconds 1: read this realm's host clock.
    const value = clock.epochNanoseconds()
    // HostSystemUTCEpochNanoseconds 2: clamp before constructing any value.
    // SystemUTCEpochNanoseconds 1–3: the realm's clock already returns bigint.
    return value < -limit ? -limit : value > limit ? limit : value
  }
  // https://tc39.es/proposal-temporal/#sec-systemtimezoneidentifier
  function systemZone(): string {
    try {
      // Steps 2–3: identify the host zone and return its normalized identifier.
      const value: unknown = clock.timeZoneId()
      if (typeof value === 'string')
        return primaryTimeZoneIdentifier(timeZoneIdentifier(value))
    } catch {
      // Host discovery failed. Explicit user-supplied zones never come here.
    }
    // Step 1 mandates UTC for UTC-only implementations. Using UTC when
    // discovery fails on other hosts is our fallback, not a spec requirement.
    return 'UTC'
  }
  function zone(value: unknown): string {
    // SystemDateTime and Now.zonedDateTimeISO 1/1.a, 2/2.a:
    // use the system zone only for undefined; propagate explicit conversion errors.
    return value === undefined ? systemZone() : timeZoneIdentifier(value)
  }
  function local(value: unknown): bigint {
    // SystemDateTime 1–2: resolve the zone before reading the clock.
    const name = zone(value),
      // Step 3: sample once; GetISODateTimeFor must use this same instant.
      ns = instant()
    // Step 4: represent the local ISO record as epoch nanoseconds plus offset.
    return ns + zonedKernel(name).offsetNanoseconds(ns)
  }
  // Temporal.Now is ordinary, inherits Object.prototype, and is neither
  // callable nor constructible. An object literal supplies all four properties.
  const result: NowObject = {
    timeZoneId() {
      // Now.timeZoneId 1: return SystemTimeZoneIdentifier().
      return zone(undefined)
    },
    instant() {
      // Now.instant 1: sample epoch nanoseconds; 2: create an Instant.
      return createInstant(instant())
    },
    plainDateTimeISO(timeZone = undefined) {
      // Now.plainDateTimeISO 1: SystemDateTime; 2: create the ISO PlainDateTime.
      return createPlainDateTime(local(timeZone), 'iso8601')
    },
    zonedDateTimeISO(timeZone = undefined) {
      // Now.zonedDateTimeISO 1–2: select and validate the zone (see zone()).
      const name = zone(timeZone)
      // Steps 3–4: sample the clock, then create the ISO ZonedDateTime.
      return createZonedDateTime(instant(), name, 'iso8601')
    },
    plainDateISO(timeZone = undefined) {
      // Now.plainDateISO 1: SystemDateTime; 2: use its date with calendar iso8601.
      return createPlainDate(epochDayOf(local(timeZone)), 'iso8601')
    },
    plainTimeISO(timeZone = undefined) {
      // Now.plainTimeISO 1: SystemDateTime; 2: create a PlainTime from its time.
      return createPlainTime(timeOf(local(timeZone)))
    },
  }
  const names = Object.keys(result)
  for (let i = 0; i < names.length; i++)
    Object.defineProperty(result, names[i], {enumerable: false})
  // Now[@@toStringTag]: non-writable and non-enumerable by default, configurable.
  Object.defineProperty(result, Symbol.toStringTag, {
    value: 'Temporal.Now',
    configurable: true,
  })
  return result
}

const HostDate = Date,
  toBigInt = BigInt,
  hostNow = Date.now,
  hostOffset = Function.prototype.call.bind(Date.prototype.getTimezoneOffset),
  HostDateTimeFormat = globalThis.Intl?.DateTimeFormat,
  hostResolvedOptions =
    HostDateTimeFormat &&
    Function.prototype.call.bind(HostDateTimeFormat.prototype.resolvedOptions)

let systemClock: SystemClock = {
  epochNanoseconds: () => toBigInt(hostNow()) * 1_000_000n,
  timeZoneId() {
    if (HostDateTimeFormat && hostResolvedOptions)
      return hostResolvedOptions(new HostDateTimeFormat()).timeZone
    // Hosts without Intl expose the current system offset through Date.
    const minutes = -hostOffset(new HostDate())
    if (minutes === 0) return 'UTC'
    const absolute = Math.abs(minutes)
    return (
      (minutes < 0 ? '-' : '+') +
      String(Math.floor(absolute / 60)).padStart(2, '0') +
      ':' +
      String(absolute % 60).padStart(2, '0')
    )
  },
}

export function configureSystemClock(clock: SystemClock): void {
  systemClock = clock
}

export const Now: NowObject = createNow({
  epochNanoseconds: () => systemClock.epochNanoseconds(),
  timeZoneId: () => systemClock.timeZoneId(),
})
