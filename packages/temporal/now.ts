import {floor, mathAbs} from '#packages/ecma262-abstract/intrinsics.js'
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
import {zeroPadDecimal} from '#packages/temporal/format-digits.js'

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
  // ECMA-262 preview §22.7.3.2 step 2: read the supplied host clock.
  // https://tc39.es/ecma262/pr/3966/#sec-systemutcepochnanoseconds
  // ECMA-262 preview §22.1.1.27: keep the result within epoch bounds.
  // https://tc39.es/ecma262/pr/3966/#sec-hostsystemutcepochnanoseconds
  function instant(): bigint {
    const value = clock.epochNanoseconds()
    return value < -limit ? -limit : value > limit ? limit : value
  }
  // ECMA-262 preview §22.2.7 steps 1–3: normalize the host zone or use UTC.
  // https://tc39.es/ecma262/pr/3966/#sec-systemtimezoneidentifier
  function systemZone(): string {
    const value: unknown = clock.timeZoneId()
    if (typeof value === 'string')
      try {
        return primaryTimeZoneIdentifier(timeZoneIdentifier(value))
      } catch {}
    return 'UTC'
  }
  // ECMA-262 preview §22.7.3.1 steps 1–2: resolve the time zone.
  // https://tc39.es/ecma262/pr/3966/#sec-systemdatetime
  function zone(value: unknown): string {
    return value === undefined ? systemZone() : timeZoneIdentifier(value)
  }
  // ECMA-262 preview §22.7.3.1 steps 3–4: project the clock into that zone.
  // https://tc39.es/ecma262/pr/3966/#sec-systemdatetime
  function local(value: unknown): bigint {
    const name = zone(value),
      ns = instant()
    return ns + zonedKernel(name).offsetNanoseconds(ns)
  }
  // ECMA-262 preview §22.7: ordinary namespace object.
  // https://tc39.es/ecma262/pr/3966/#sec-temporal-now-object
  const result: NowObject = {
    // ECMA-262 preview §22.7.2.1 step 1.
    // https://tc39.es/ecma262/pr/3966/#sec-temporal.now.timezoneid
    timeZoneId() {
      return zone(undefined)
    },
    // ECMA-262 preview §22.7.2.2 steps 1–2.
    // https://tc39.es/ecma262/pr/3966/#sec-temporal.now.instant
    instant() {
      return createInstant(instant())
    },
    // ECMA-262 preview §22.7.2.3 steps 1–2.
    // https://tc39.es/ecma262/pr/3966/#sec-temporal.now.plaindatetimeiso
    plainDateTimeISO(timeZone = undefined) {
      return createPlainDateTime(local(timeZone), 'iso8601')
    },
    // ECMA-262 preview §22.7.2.4 steps 1–4.
    // https://tc39.es/ecma262/pr/3966/#sec-temporal.now.zoneddatetimeiso
    zonedDateTimeISO(timeZone = undefined) {
      const name = zone(timeZone)
      return createZonedDateTime(instant(), name, 'iso8601')
    },
    // ECMA-262 preview §22.7.2.5 steps 1–2.
    // https://tc39.es/ecma262/pr/3966/#sec-temporal.now.plaindateiso
    plainDateISO(timeZone = undefined) {
      return createPlainDate(epochDayOf(local(timeZone)), 'iso8601')
    },
    // ECMA-262 preview §22.7.2.6 steps 1–2.
    // https://tc39.es/ecma262/pr/3966/#sec-temporal.now.plaintimeiso
    plainTimeISO(timeZone = undefined) {
      return createPlainTime(timeOf(local(timeZone)))
    },
  }
  const names = Object.keys(result)
  for (let i = 0; i < names.length; i++)
    Object.defineProperty(result, names[i], {enumerable: false})
  // ECMA-262 preview §22.7.1.1.
  // https://tc39.es/ecma262/pr/3966/#sec-temporal.now.%symbol.tostringtag%
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
    // Temporal comparison §2.2.1 step1: return the private system-zone identifier.
    const absolute = mathAbs(minutes)
    return (
      (minutes < 0 ? '-' : '+') +
      zeroPadDecimal(floor(absolute / 60), 2) +
      ':' +
      zeroPadDecimal(absolute % 60, 2)
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
