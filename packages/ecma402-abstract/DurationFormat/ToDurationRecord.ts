import {
  RangeErrorConstructor,
  TypeErrorConstructor,
} from '#packages/ecma262-abstract/intrinsics.js'
import {IsObject} from '#packages/ecma262-abstract/IsObject.js'
import {
  type DurationInput,
  type DurationRecord,
} from '#packages/ecma402-abstract/types/duration.js'
import {IsValidDurationRecord} from '#packages/ecma402-abstract/DurationFormat/IsValidDurationRecord.js'
import {ToIntegerIfIntegral} from '#packages/ecma402-abstract/DurationFormat/ToIntegerIfIntegral.js'

const durationPropertyNames = [
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
] as const

// ECMA-402 §13.5.3 steps 1–2 distinguish string errors and initialize the record.
// https://tc39.es/ecma402/#sec-todurationrecord
export function ToDurationRecord(input: DurationInput): DurationRecord {
  if (!IsObject(input)) {
    if (typeof input === 'string') {
      throw new RangeErrorConstructor('Invalid duration format')
    }
    throw new TypeErrorConstructor('Invalid duration')
  }
  // ECMA-402 §13.5.1 and Table 22 https://tc39.es/ecma402/#sec-duration-records
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
  // Steps 3–22 interleave each property read with its integer conversion.
  let anyDefined = false
  for (let index = 0; index < durationPropertyNames.length; index++) {
    const field = durationPropertyNames[index]
    const value = input[field]
    if (value !== undefined) {
      anyDefined = true
      result[field] = ToIntegerIfIntegral(value)
    }
  }
  // Steps 23–24 validate the record after all successful conversions.
  if (!anyDefined) {
    throw new TypeErrorConstructor('Invalid duration format')
  }
  if (!IsValidDurationRecord(result)) {
    throw new RangeErrorConstructor('Invalid duration format')
  }
  return result
}
