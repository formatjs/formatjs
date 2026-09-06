import {
  type DurationInput,
  type DurationRecord,
} from '#packages/ecma402-abstract/types/duration.js'
import {IsValidDurationRecord} from '#packages/ecma402-abstract/DurationFormat/IsValidDurationRecord.js'
import {ToIntegerIfIntegral} from '#packages/ecma402-abstract/DurationFormat/ToIntegerIfIntegral.js'

export function ToDurationRecord(input: DurationInput): DurationRecord {
  if (
    (typeof input !== 'object' || input === null) &&
    typeof input !== 'function'
  ) {
    if (typeof input === 'string') {
      throw new RangeError('Invalid duration format')
    }
    throw new TypeError('Invalid duration')
  }
  const result: DurationRecord = {
    years: 0,
    months: 0,
    weeks: 0,
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    milliseconds: 0,
    microseconds: 0,
    nanoseconds: 0,
  }
  // Read each field once, in ToDurationRecord's specified order.
  // ECMA-402 §13.5.3 ToDurationRecord, steps 3–24.a.
  // https://tc39.es/ecma402/#sec-todurationrecord
  // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/durationformat.html#L495-L517
  let anyDefined = false
  for (const field of [
    'days',
    'hours',
    'microseconds',
    'milliseconds',
    'minutes',
    'months',
    'nanoseconds',
    'seconds',
    'weeks',
    'years',
  ] as const) {
    const value = input[field]
    if (value !== undefined) {
      anyDefined = true
      result[field] = ToIntegerIfIntegral(value)
    }
  }
  if (!anyDefined) {
    throw new TypeError('Invalid duration format')
  }
  if (!IsValidDurationRecord(result)) {
    throw new RangeError('Invalid duration format')
  }
  return result
}
