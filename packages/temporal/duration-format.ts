import {nativeTemporal} from '#packages/temporal/native.js'
import {
  durationFieldNames,
  durationSign,
  zeroDuration,
  type DurationFields,
} from '#packages/temporal/duration-core.js'

export function formatDuration(
  fields: DurationFields,
  digits: number | 'auto' = 'auto'
): string {
  const native = nativeTemporal()
  if (native) return native.formatDuration(fields, digits, 'trunc')
  const sign = durationSign(fields)
  const absolute = zeroDuration()
  for (let index = 0; index < durationFieldNames.length; index++) {
    const key = durationFieldNames[index]
    absolute[key] = Math.abs(fields[key])
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
    BigInt(absolute.seconds) * 1_000_000_000n +
    BigInt(absolute.milliseconds) * 1_000_000n +
    BigInt(absolute.microseconds) * 1000n +
    BigInt(absolute.nanoseconds)
  const fraction = String(secondNs % 1_000_000_000n).padStart(9, '0')
  const decimals =
    digits === 'auto' ? fraction.replace(/0+$/, '') : fraction.slice(0, digits)
  if (
    secondNs !== 0n ||
    digits !== 'auto' ||
    ((result === 'P' || result === '-P') && time === '')
  )
    time +=
      String(secondNs / 1_000_000_000n) + (decimals ? '.' + decimals : '') + 'S'
  return result + (time ? 'T' + time : '')
}
