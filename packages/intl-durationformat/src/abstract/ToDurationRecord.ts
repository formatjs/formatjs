import {type DurationInput, type DurationRecord} from '../types.js'
import {IsValidDurationRecord} from './IsValidDurationRecord.js'
import {ToIntegerIfIntegral} from './ToIntegerIfIntegral.js'

export function ToDurationRecord(input: DurationInput): DurationRecord {
  if (typeof input !== 'object') {
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
  if (input.days !== undefined) {
    result.days = ToIntegerIfIntegral(input.days)
  }
  if (input.hours !== undefined) {
    result.hours = ToIntegerIfIntegral(input.hours)
  }
  if (input.microseconds !== undefined) {
    result.microseconds = ToIntegerIfIntegral(input.microseconds)
  }
  if (input.milliseconds !== undefined) {
    result.milliseconds = ToIntegerIfIntegral(input.milliseconds)
  }
  if (input.minutes !== undefined) {
    result.minutes = ToIntegerIfIntegral(input.minutes)
  }
  if (input.months !== undefined) {
    result.months = ToIntegerIfIntegral(input.months)
  }
  if (input.nanoseconds !== undefined) {
    result.nanoseconds = ToIntegerIfIntegral(input.nanoseconds)
  }
  if (input.seconds !== undefined) {
    result.seconds = ToIntegerIfIntegral(input.seconds)
  }
  if (input.weeks !== undefined) {
    result.weeks = ToIntegerIfIntegral(input.weeks)
  }
  if (input.years !== undefined) {
    result.years = ToIntegerIfIntegral(input.years)
  }
  if (
    input.years === undefined &&
    input.months === undefined &&
    input.weeks === undefined &&
    input.days === undefined &&
    input.hours === undefined &&
    input.minutes === undefined &&
    input.seconds === undefined &&
    input.milliseconds === undefined &&
    input.microseconds === undefined &&
    input.nanoseconds === undefined
  ) {
    throw new TypeError('Invalid duration format')
  }
  if (!IsValidDurationRecord(result)) {
    throw new RangeError('Invalid duration format')
  }
  return result
}
