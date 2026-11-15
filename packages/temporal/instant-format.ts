import {epochNanosecondsToISO} from '#packages/temporal/kernel.js'
import type {Precision} from '#packages/temporal/rounding.js'

export function formatInstant(
  value: bigint,
  precision: Precision = 'auto',
  offset?: bigint
): string {
  const fields = epochNanosecondsToISO(value + (offset ?? 0n))
  const pad = (value: number, length = 2): string =>
    String(value).padStart(length, '0')
  const year =
    fields.year >= 0 && fields.year <= 9999
      ? pad(fields.year, 4)
      : (fields.year < 0 ? '-' : '+') + pad(Math.abs(fields.year), 6)
  let result = `${year}-${pad(fields.month)}-${pad(fields.day)}T${pad(fields.hour)}:${pad(fields.minute)}`
  if (precision !== 'minute') {
    result += `:${pad(fields.second)}`
    const digits = pad(
      fields.millisecond * 1_000_000 +
        fields.microsecond * 1000 +
        fields.nanosecond,
      9
    )
    const fraction =
      precision === 'auto'
        ? digits.replace(/0+$/, '')
        : digits.slice(0, precision)
    if (fraction) result += '.' + fraction
  }
  if (offset === undefined) return result + 'Z'
  const absolute = offset < 0n ? -offset : offset
  const minutes = Number((absolute + 30_000_000_000n) / 60_000_000_000n)
  return (
    result +
    (offset < 0n && minutes !== 0 ? '-' : '+') +
    pad(Math.floor(minutes / 60)) +
    ':' +
    pad(minutes % 60)
  )
}
