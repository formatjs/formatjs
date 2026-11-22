import {ToString} from '#packages/ecma262-abstract/ToString.js'
import {formatFractionalSeconds} from '#packages/temporal/format-digits.js'
import {
  bigIntFrom,
  mathAbs,
  numberFrom,
} from '#packages/ecma262-abstract/intrinsics.js'
import {nativeTemporal} from '#packages/temporal/native.js'
import {
  durationFieldNames,
  durationSign,
  zeroDuration,
  type DurationFields,
} from '#packages/temporal/duration-core.js'

// Temporal comparison §7.5.40 steps 12–17.
// Serialize prepared duration fields and the exact seconds fraction.
export function formatDuration(
  fields: DurationFields,
  digits: number | 'auto' = 'auto'
): string {
  const native = nativeTemporal()
  if (import.meta.formatjsTemporalNativeData === true || native)
    return native!.formatDuration(fields, digits, 'trunc')
  const sign = durationSign(fields)
  const absolute = zeroDuration()
  for (let index = 0; index < durationFieldNames.length; index++) {
    const key = durationFieldNames[index]
    absolute[key] = mathAbs(fields[key])
  }
  let result = sign < 0 ? '-P' : 'P'
  const designators = ['Y', 'M', 'W', 'D']
  for (let index = 0; index < 4; index++) {
    const key = durationFieldNames[index]
    if (absolute[key]) result += absolute[key] + designators[index]
  }
  let time = ''
  if (absolute.hours) time += absolute.hours + 'H'
  if (absolute.minutes) time += absolute.minutes + 'M'
  const secondNs =
    bigIntFrom(absolute.seconds) * 1_000_000_000n +
    bigIntFrom(absolute.milliseconds) * 1_000_000n +
    bigIntFrom(absolute.microseconds) * 1000n +
    bigIntFrom(absolute.nanoseconds)
  const decimals = formatFractionalSeconds(
    numberFrom(secondNs % 1_000_000_000n),
    digits
  )
  if (
    secondNs !== 0n ||
    digits !== 'auto' ||
    ((result === 'P' || result === '-P') && time === '')
  )
    time += ToString(secondNs / 1_000_000_000n) + decimals + 'S'
  return result + (time ? 'T' + time : '')
}
