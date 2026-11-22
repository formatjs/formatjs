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
// ECMA-262 preview §22.6: ordinary namespace object.
// https://tc39.es/ecma262/pr/3966/#sec-temporal-object
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
  {},
  {
    // ECMA-262 preview §22.6.3.1.
    // https://tc39.es/ecma262/pr/3966/#sec-temporal.now
    Now: {value: Now, writable: true, configurable: true},
    // ECMA-262 preview §22.6.2.8.
    // https://tc39.es/ecma262/pr/3966/#sec-temporal-zoneddatetime
    ZonedDateTime: {value: ZonedDateTime, writable: true, configurable: true},
    // ECMA-262 preview §22.6.2.2.
    // https://tc39.es/ecma262/pr/3966/#sec-temporal-instant
    Instant: {value: Instant, writable: true, configurable: true},
    // ECMA-262 preview §22.6.2.1.
    // https://tc39.es/ecma262/pr/3966/#sec-temporal-duration
    Duration: {value: Duration, writable: true, configurable: true},
    // ECMA-262 preview §22.6.2.6.
    // https://tc39.es/ecma262/pr/3966/#sec-temporal-plaintime
    PlainTime: {value: PlainTime, writable: true, configurable: true},
    // ECMA-262 preview §22.6.2.4.
    // https://tc39.es/ecma262/pr/3966/#sec-temporal-plaindatetime
    PlainDateTime: {value: PlainDateTime, writable: true, configurable: true},
    // ECMA-262 preview §22.6.2.3.
    // https://tc39.es/ecma262/pr/3966/#sec-temporal-plaindate
    PlainDate: {value: PlainDate, writable: true, configurable: true},
    // ECMA-262 preview §22.6.2.7.
    // https://tc39.es/ecma262/pr/3966/#sec-temporal-plainyearmonth
    PlainYearMonth: {value: PlainYearMonth, writable: true, configurable: true},
    // ECMA-262 preview §22.6.2.5.
    // https://tc39.es/ecma262/pr/3966/#sec-temporal-plainmonthday
    PlainMonthDay: {value: PlainMonthDay, writable: true, configurable: true},
    // ECMA-262 preview §22.6.1.1.
    // https://tc39.es/ecma262/pr/3966/#sec-temporal-%symbol.tostringtag%
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
