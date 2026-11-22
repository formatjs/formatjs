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
  {},
  {
    // Temporal comparison §1.3.1: namespace property attributes.
    // https://tc39.es/proposal-temporal/#sec-temporal-now
    Now: {value: Now, writable: true, configurable: true},
    // Temporal comparison §1.2.8: namespace property attributes.
    // https://tc39.es/proposal-temporal/#sec-temporal-zoneddatetime
    ZonedDateTime: {value: ZonedDateTime, writable: true, configurable: true},
    // Temporal comparison §1.2.1: namespace property attributes.
    // https://tc39.es/proposal-temporal/#sec-temporal-instant
    Instant: {value: Instant, writable: true, configurable: true},
    // Temporal comparison §1.2.7: namespace property attributes.
    // https://tc39.es/proposal-temporal/#sec-temporal-duration
    Duration: {value: Duration, writable: true, configurable: true},
    // Temporal comparison §1.2.4: namespace property attributes.
    // https://tc39.es/proposal-temporal/#sec-temporal-plaintime
    PlainTime: {value: PlainTime, writable: true, configurable: true},
    // Temporal comparison §1.2.2: namespace property attributes.
    // https://tc39.es/proposal-temporal/#sec-temporal-plaindatetime
    PlainDateTime: {value: PlainDateTime, writable: true, configurable: true},
    // Temporal comparison §1.2.3: namespace property attributes.
    // https://tc39.es/proposal-temporal/#sec-temporal-plaindate
    PlainDate: {value: PlainDate, writable: true, configurable: true},
    // Temporal comparison §1.2.5: namespace property attributes.
    // https://tc39.es/proposal-temporal/#sec-temporal-plainyearmonth
    PlainYearMonth: {value: PlainYearMonth, writable: true, configurable: true},
    // Temporal comparison §1.2.6: namespace property attributes.
    // https://tc39.es/proposal-temporal/#sec-temporal-plainmonthday
    PlainMonthDay: {value: PlainMonthDay, writable: true, configurable: true},
    // Temporal comparison §1.1.1: namespace property attributes.
    // https://tc39.es/proposal-temporal/#sec-temporal-%symbol.tostringtag%
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
