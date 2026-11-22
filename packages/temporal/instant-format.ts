import {
  formatFractionalSeconds,
  zeroPadDecimal,
} from '#packages/temporal/format-digits.js'
import {
  floor,
  mathAbs,
  numberFrom,
} from '#packages/ecma262-abstract/intrinsics.js'
import {epochNanosecondsToISO} from '#packages/temporal/kernel.js'
import type {Precision} from '#packages/temporal/rounding.js'

export function formatInstant(
  value: bigint,
  precision: Precision = 'auto',
  offset?: bigint
): string {
  const fields = epochNanosecondsToISO(value + (offset ?? 0n))
  const pad = (value: number, length = 2): string =>
    zeroPadDecimal(value, length)
  const year =
    fields.year >= 0 && fields.year <= 9999
      ? pad(fields.year, 4)
      : (fields.year < 0 ? '-' : '+') + pad(mathAbs(fields.year), 6)
  let result = `${year}-${pad(fields.month)}-${pad(fields.day)}T${pad(fields.hour)}:${pad(fields.minute)}`
  if (precision !== 'minute') {
    result += `:${pad(fields.second)}`
    result += formatFractionalSeconds(
      fields.millisecond * 1_000_000 +
        fields.microsecond * 1000 +
        fields.nanosecond,
      precision
    )
  }
  if (offset === undefined) return result + 'Z'
  const absolute = offset < 0n ? -offset : offset
  const minutes = numberFrom((absolute + 30_000_000_000n) / 60_000_000_000n)
  return (
    result +
    (offset < 0n && minutes !== 0 ? '-' : '+') +
    pad(floor(minutes / 60)) +
    ':' +
    pad(minutes % 60)
  )
}
