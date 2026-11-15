import {Instant, type InstantConstructor} from '#packages/temporal/instant.js'
import {
  Duration,
  type DurationConstructor,
} from '#packages/temporal/duration.js'
export {Instant, Duration}
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
} = Object.defineProperties(
  {},
  {
    Instant: {value: Instant, writable: true, configurable: true},
    Duration: {value: Duration, writable: true, configurable: true},
    [Symbol.toStringTag]: {value: 'Temporal', configurable: true},
  }
) as {Instant: InstantConstructor; Duration: DurationConstructor}
