import {TABLE_1} from '#packages/ecma402-abstract/DurationFormat/constants.js'
import {type DurationRecord} from '#packages/ecma402-abstract/types/duration.js'
import {DurationRecordSign} from '#packages/ecma402-abstract/DurationFormat/DurationRecordSign.js'

export function IsValidDurationRecord(record: DurationRecord): boolean {
  const sign = DurationRecordSign(record)
  for (const key of TABLE_1) {
    const v = record[key]
    if (!Number.isFinite(v)) return false
    if (v < 0 && sign > 0) {
      return false
    }
    if (v > 0 && sign < 0) {
      return false
    }
  }
  // IsValidDuration bounds calendar units and exact normalized seconds.
  // https://tc39.es/ecma402/#sec-isvalidduration
  if (
    (['years', 'months', 'weeks'] as const).some(
      unit => Math.abs(record[unit]) >= 2 ** 32
    )
  ) {
    return false
  }
  // Scaling integral Number values with BigInt avoids rounding at 2**53 seconds.
  const billion = BigInt(1000000000)
  const normalizedNanoseconds =
    BigInt(record.days) * BigInt(86400) * billion +
    BigInt(record.hours) * BigInt(3600) * billion +
    BigInt(record.minutes) * BigInt(60) * billion +
    BigInt(record.seconds) * billion +
    BigInt(record.milliseconds) * BigInt(1000000) +
    BigInt(record.microseconds) * BigInt(1000) +
    BigInt(record.nanoseconds)
  const limit = BigInt(2 ** 53) * billion
  return normalizedNanoseconds > -limit && normalizedNanoseconds < limit
}
