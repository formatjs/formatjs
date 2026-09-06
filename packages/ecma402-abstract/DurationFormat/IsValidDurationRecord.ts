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
  const normalizedNanoseconds =
    BigInt(record.days) * 86400n * 1000000000n +
    BigInt(record.hours) * 3600n * 1000000000n +
    BigInt(record.minutes) * 60n * 1000000000n +
    BigInt(record.seconds) * 1000000000n +
    BigInt(record.milliseconds) * 1000000n +
    BigInt(record.microseconds) * 1000n +
    BigInt(record.nanoseconds)
  const limit = 2n ** 53n * 1000000000n
  return normalizedNanoseconds > -limit && normalizedNanoseconds < limit
}
