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
export {Instant, Duration, PlainTime, PlainDateTime, PlainDate}
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
  Instant: InstantConstructor
  Duration: DurationConstructor
  PlainTime: PlainTimeConstructor
  PlainDateTime: PlainDateTimeConstructor
  PlainDate: PlainDateConstructor
} = Object.defineProperties(
  {},
  {
    Instant: {value: Instant, writable: true, configurable: true},
    Duration: {value: Duration, writable: true, configurable: true},
    PlainTime: {value: PlainTime, writable: true, configurable: true},
    PlainDateTime: {value: PlainDateTime, writable: true, configurable: true},
    PlainDate: {value: PlainDate, writable: true, configurable: true},
    [Symbol.toStringTag]: {value: 'Temporal', configurable: true},
  }
) as {
  Instant: InstantConstructor
  Duration: DurationConstructor
  PlainTime: PlainTimeConstructor
  PlainDateTime: PlainDateTimeConstructor
  PlainDate: PlainDateConstructor
}
