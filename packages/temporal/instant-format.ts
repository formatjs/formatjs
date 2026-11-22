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

// Temporal comparison §8.5.8 steps4–8: format a prepared epoch/offset; caller resolves the zone
// https://tc39.es/proposal-temporal/#sec-temporal-temporalinstanttostring
export function formatInstant(
  value: bigint,
  precision: Precision = 'auto',
  offset?: bigint
): string {
  const fields = epochNanosecondsToISO(value + (offset ?? 0n))
  // Temporal comparison §3.5.10 steps 1 and 3, §5.5.9 steps 2 and 3,
  // §13.26 steps 2, 3 and 5. Pad the magnitude to the requested width.
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
  // Comparison §11.1.7 steps1–3: half-expand the offset to whole minutes.
  // https://tc39.es/proposal-temporal/#sec-temporal-formatdatetimeutcoffsetrounded
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
