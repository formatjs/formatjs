import {ToDurationRecord} from '#packages/ecma402-abstract/DurationFormat/ToDurationRecord.js'
import type {
  DurationInput,
  DurationRecord,
} from '#packages/ecma402-abstract/types/duration.js'

interface TemporalDurationConstructor {
  prototype: object
  from(value: string): object
}

// Capture intrinsic operations before application code can replace public getters.
// A Temporal implementation must be installed before this module is loaded.
const temporalDuration = (
  globalThis as typeof globalThis & {
    Temporal?: {Duration: TemporalDurationConstructor}
  }
).Temporal?.Duration
const durationFrom = temporalDuration?.from
const fields = [
  'years',
  'months',
  'weeks',
  'days',
  'hours',
  'minutes',
  'seconds',
  'milliseconds',
  'microseconds',
  'nanoseconds',
] as const
const getters =
  temporalDuration &&
  fields.map(
    field =>
      Object.getOwnPropertyDescriptor(temporalDuration.prototype, field)!.get!
  )

// Temporal proposal: DurationFormat format/formatToParts, step 3, and
// ToTemporalDuration steps 1–2 read branded slots or parse a duration string.
// https://tc39.es/proposal-temporal/#sec-Intl.DurationFormat.prototype.format
// https://github.com/tc39/proposal-temporal/blob/e8cc03fc970a65a3359e8870e3b35e687ac94e55/spec/intl.html#L1787-L1789
// https://github.com/tc39/proposal-temporal/blob/e8cc03fc970a65a3359e8870e3b35e687ac94e55/spec/intl.html#L1804-L1806
// https://tc39.es/proposal-temporal/#sec-temporal-totemporalduration
// https://github.com/tc39/proposal-temporal/blob/e8cc03fc970a65a3359e8870e3b35e687ac94e55/spec/duration.html#L1078-L1082
export function ToTemporalDurationRecord(
  input: DurationInput | string
): DurationRecord {
  if (typeof input === 'string' && durationFrom) {
    input = durationFrom.call(temporalDuration, input) as DurationInput
  }
  if (
    getters &&
    input !== null &&
    (typeof input === 'object' || typeof input === 'function')
  ) {
    let years: number
    try {
      years = getters[0].call(input)
    } catch {
      // Ordinary duration-like objects retain their specified property-read order.
      return ToDurationRecord(input)
    }
    const record = Object.create(null) as DurationRecord
    record.years = years
    for (let i = 1; i < fields.length; i++) {
      record[fields[i]] = getters[i].call(input)
    }
    return record
  }
  return ToDurationRecord(input as DurationInput)
}
