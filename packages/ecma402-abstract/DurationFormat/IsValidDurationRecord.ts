import {
  arraySome,
  bigIntFrom,
  mathAbs,
  numberIsFinite,
} from '#packages/ecma262-abstract/intrinsics.js'
import {TABLE_1} from '#packages/ecma402-abstract/DurationFormat/constants.js'
import {type DurationRecord} from '#packages/ecma402-abstract/types/duration.js'
import {DurationRecordSign} from '#packages/ecma402-abstract/DurationFormat/DurationRecordSign.js'

export function IsValidDurationRecord(record: DurationRecord): boolean {
  const sign = DurationRecordSign(record)
  // ECMA-402 §13.5.5 steps1–2: private fields do not consult Array iterators.
  // https://tc39.es/ecma402/#sec-isvalidduration
  for (let index = 0; index < TABLE_1.length; index++) {
    const key = TABLE_1[index]
    const v = record[key]
    if (!numberIsFinite(v)) return false
    if (v < 0 && sign > 0) {
      return false
    }
    if (v > 0 && sign < 0) {
      return false
    }
  }
  // IsValidDuration bounds calendar units and exact normalized seconds.
  // ECMA-402 §13.5.5 IsValidDuration, steps 3–8.
  // https://tc39.es/ecma402/#sec-isvalidduration
  // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/durationformat.html#L569-L574
  if (
    arraySome(
      ['years', 'months', 'weeks'] as const,
      unit => mathAbs(record[unit]) >= 2 ** 32
    )
  ) {
    return false
  }
  // Scaling integral Number values with BigInt avoids rounding at 2**53 seconds.
  const billion = bigIntFrom(1000000000)
  const normalizedNanoseconds =
    bigIntFrom(record.days) * bigIntFrom(86400) * billion +
    bigIntFrom(record.hours) * bigIntFrom(3600) * billion +
    bigIntFrom(record.minutes) * bigIntFrom(60) * billion +
    bigIntFrom(record.seconds) * billion +
    bigIntFrom(record.milliseconds) * bigIntFrom(1000000) +
    bigIntFrom(record.microseconds) * bigIntFrom(1000) +
    bigIntFrom(record.nanoseconds)
  const limit = bigIntFrom(2 ** 53) * billion
  return normalizedNanoseconds > -limit && normalizedNanoseconds < limit
}
