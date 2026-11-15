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
  function instant(): bigint {
    const value = clock.epochNanoseconds()
    return value < -limit ? -limit : value > limit ? limit : value
  }
  function zone(value: unknown): string {
    if (value !== undefined) return timeZoneIdentifier(value)
    return primaryTimeZoneIdentifier(timeZoneIdentifier(clock.timeZoneId()))
  }
  function local(value: unknown): bigint {
    const name = zone(value),
      ns = instant()
    return ns + zonedKernel(name).offsetNanoseconds(ns)
  }
  const result: NowObject = {
    timeZoneId() {
      return zone(undefined)
    },
    instant() {
      return createInstant(instant())
    },
    plainDateTimeISO(timeZone = undefined) {
      return createPlainDateTime(local(timeZone), 'iso8601')
    },
    zonedDateTimeISO(timeZone = undefined) {
      const name = zone(timeZone)
      return createZonedDateTime(instant(), name, 'iso8601')
    },
    plainDateISO(timeZone = undefined) {
      return createPlainDate(epochDayOf(local(timeZone)), 'iso8601')
    },
    plainTimeISO(timeZone = undefined) {
      return createPlainTime(timeOf(local(timeZone)))
    },
  }
  const names = Object.keys(result)
  for (let i = 0; i < names.length; i++)
    Object.defineProperty(result, names[i], {enumerable: false})
  Object.defineProperty(result, Symbol.toStringTag, {
    value: 'Temporal.Now',
    configurable: true,
  })
  return result
}

const HostDate = Date,
  hostNow = Date.now,
  hostOffset = Function.prototype.call.bind(Date.prototype.getTimezoneOffset),
  HostDateTimeFormat = globalThis.Intl?.DateTimeFormat,
  hostResolvedOptions =
    HostDateTimeFormat &&
    Function.prototype.call.bind(HostDateTimeFormat.prototype.resolvedOptions)

export const Now: NowObject = createNow({
  epochNanoseconds: () => BigInt(hostNow()) * 1_000_000n,
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
})
