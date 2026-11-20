import {Now, type NowObject} from '#packages/temporal/now.js'
import {
  ZonedDateTime,
  type ZonedDateTimeConstructor,
} from '#packages/temporal/zoned-date-time.js'
import {Instant, type InstantConstructor} from '#packages/temporal/instant.js'
import {
  Duration,
  type DurationConstructor,
} from '#packages/temporal/duration.js'
import {
  PlainTime,
  type PlainTimeConstructor,
} from '#packages/temporal/plain-time.js'
import {
  PlainDateTime,
  type PlainDateTimeConstructor,
} from '#packages/temporal/plain-date-time.js'
import {
  PlainDate,
  type PlainDateConstructor,
} from '#packages/temporal/plain-date.js'
import {
  PlainYearMonth,
  type PlainYearMonthConstructor,
} from '#packages/temporal/plain-year-month.js'
import {
  PlainMonthDay,
  type PlainMonthDayConstructor,
} from '#packages/temporal/plain-month-day.js'
export {
  Now,
  ZonedDateTime,
  Instant,
  Duration,
  PlainTime,
  PlainDateTime,
  PlainDate,
  PlainYearMonth,
  PlainMonthDay,
}
export type {
  ZonedDateTimeConstructor,
  ZonedDateTimeObject,
} from '#packages/temporal/zoned-date-time.js'
export type {
  PlainYearMonthConstructor,
  PlainYearMonthObject,
} from '#packages/temporal/plain-year-month.js'
export type {
  PlainMonthDayConstructor,
  PlainMonthDayObject,
} from '#packages/temporal/plain-month-day.js'
export type {
  PlainDateTimeConstructor,
  PlainDateTimeObject,
} from '#packages/temporal/plain-date-time.js'
export type {
  PlainDateConstructor,
  PlainDateObject,
} from '#packages/temporal/plain-date.js'
export type {
  PlainTimeConstructor,
  PlainTimeObject,
} from '#packages/temporal/plain-time.js'
export type {
  InstantConstructor,
  InstantObject,
} from '#packages/temporal/instant.js'
export type {
  DurationConstructor,
  DurationObject,
} from '#packages/temporal/duration.js'
export const Temporal: {
  Now: NowObject
  ZonedDateTime: ZonedDateTimeConstructor
  Instant: InstantConstructor
  Duration: DurationConstructor
  PlainTime: PlainTimeConstructor
  PlainDateTime: PlainDateTimeConstructor
  PlainDate: PlainDateConstructor
  PlainYearMonth: PlainYearMonthConstructor
  PlainMonthDay: PlainMonthDayConstructor
} = Object.defineProperties(
  // Temporal object: ordinary, Object.prototype, no [[Call]] or [[Construct]].
  // https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/temporal.html#L4-L23
  {},
  {
    // Constructor and Now properties reference the objects, not wrapper functions.
    Now: {value: Now, writable: true, configurable: true},
    ZonedDateTime: {value: ZonedDateTime, writable: true, configurable: true},
    Instant: {value: Instant, writable: true, configurable: true},
    Duration: {value: Duration, writable: true, configurable: true},
    PlainTime: {value: PlainTime, writable: true, configurable: true},
    PlainDateTime: {value: PlainDateTime, writable: true, configurable: true},
    PlainDate: {value: PlainDate, writable: true, configurable: true},
    PlainYearMonth: {value: PlainYearMonth, writable: true, configurable: true},
    PlainMonthDay: {value: PlainMonthDay, writable: true, configurable: true},
    // @@toStringTag is configurable, but neither writable nor enumerable.
    [Symbol.toStringTag]: {value: 'Temporal', configurable: true},
  }
) as {
  Now: NowObject
  ZonedDateTime: ZonedDateTimeConstructor
  Instant: InstantConstructor
  Duration: DurationConstructor
  PlainTime: PlainTimeConstructor
  PlainDateTime: PlainDateTimeConstructor
  PlainDate: PlainDateConstructor
  PlainYearMonth: PlainYearMonthConstructor
  PlainMonthDay: PlainMonthDayConstructor
}

export type {NowObject} from '#packages/temporal/now.js'

export type TemporalNamespace = typeof Temporal
export {toTemporalInstant} from '#packages/temporal/date-to-temporal-instant.js'
