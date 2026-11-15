export const durationFieldNames = [
  'years',
  'months',
  'weeks',
  'days',
  'hours',
  'minutes',
  'seconds',
  'milliseconds',
  'microseconds',
  'nanoseconds',
] as const
export type DurationField = (typeof durationFieldNames)[number]
export type DurationFields = Record<DurationField, number>
export const maxDurationNanoseconds = 9_007_199_254_740_992_000_000_000n
const timeFactors = [
  86_400_000_000_000n,
  3_600_000_000_000n,
  60_000_000_000n,
  1_000_000_000n,
  1_000_000n,
  1000n,
  1n,
]

export function zeroDuration(): DurationFields {
  return {
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
}
export function durationSign(fields: DurationFields): -1 | 0 | 1 {
  for (const key of durationFieldNames) {
    if (fields[key] < 0) return -1
    if (fields[key] > 0) return 1
  }
  return 0
}
export function durationNanoseconds(
  fields: DurationFields,
  includeDays = true
): bigint {
  let value = 0n
  for (let i = includeDays ? 3 : 4; i < durationFieldNames.length; i++)
    value += BigInt(fields[durationFieldNames[i]]) * timeFactors[i - 3]
  return value
}
export function validateDuration(fields: DurationFields): DurationFields {
  const sign = durationSign(fields)
  for (const key of durationFieldNames) {
    const value = fields[key]
    if (
      !Number.isInteger(value) ||
      (value !== 0 && (value < 0 ? -1 : 1) !== sign)
    )
      throw new RangeError('Invalid duration fields')
    fields[key] = value || 0
  }
  if (
    Math.abs(fields.years) >= 4294967296 ||
    Math.abs(fields.months) >= 4294967296 ||
    Math.abs(fields.weeks) >= 4294967296
  )
    throw new RangeError('Calendar duration out of range')
  const time = durationNanoseconds(fields)
  if (time <= -maxDurationNanoseconds || time >= maxDurationNanoseconds)
    throw new RangeError('Duration out of range')
  return fields
}
export function integralDurationNumber(value: unknown): number {
  const number = +(value as number)
  if (!Number.isInteger(number))
    throw new RangeError('Duration fields must be integral')
  return number || 0
}
export function partialDuration(value: unknown): Partial<DurationFields> {
  if (
    value === null ||
    (typeof value !== 'object' && typeof value !== 'function')
  )
    throw new TypeError('Duration fields must be an object')
  const result: Partial<DurationFields> = Object.create(null)
  let found = false
  for (const field of [...durationFieldNames].sort()) {
    const number = (value as Record<string, unknown>)[field]
    if (number !== undefined) {
      result[field] = integralDurationNumber(number)
      found = true
    }
  }
  if (!found) throw new TypeError('Duration fields required')
  return result
}
export function parseDurationString(value: string): DurationFields {
  const match =
    /^([+-])?P(?:(\d+)Y)?(?:(\d+)M)?(?:(\d+)W)?(?:(\d+)D)?(?:T(?:(\d+)([.,]\d{1,9})?H)?(?:(\d+)([.,]\d{1,9})?M)?(?:(\d+)([.,]\d{1,9})?S)?)?$/i.exec(
      value
    )
  if (
    !match ||
    match[0] !== value ||
    ![2, 3, 4, 5, 6, 8, 10].some(i => match[i] !== undefined) ||
    (/[Tt]/.test(value) && ![6, 8, 10].some(i => match[i] !== undefined)) ||
    (match[7] !== undefined &&
      (match[8] !== undefined || match[10] !== undefined)) ||
    (match[9] !== undefined && match[10] !== undefined)
  )
    throw new RangeError('Invalid duration string')
  const result = zeroDuration()
  for (const [index, field] of [
    [2, 'years'],
    [3, 'months'],
    [4, 'weeks'],
    [5, 'days'],
    [6, 'hours'],
    [8, 'minutes'],
    [10, 'seconds'],
  ] as const)
    result[field] = +(match[index] ?? 0)
  const fraction = (text: string | undefined): bigint =>
    BigInt((text?.slice(1) ?? '').padEnd(9, '0'))
  let extra =
    fraction(match[7]) * 3600n + fraction(match[9]) * 60n + fraction(match[11])
  result.minutes += Number(extra / 60_000_000_000n)
  extra %= 60_000_000_000n
  result.seconds += Number(extra / 1_000_000_000n)
  extra %= 1_000_000_000n
  result.milliseconds = Number(extra / 1_000_000n)
  result.microseconds = Number((extra / 1000n) % 1000n)
  result.nanoseconds = Number(extra % 1000n)
  if (match[1] === '-')
    for (const field of durationFieldNames) result[field] = -result[field] || 0
  return validateDuration(result)
}
export function balanceDurationTime(
  value: bigint,
  largest: number
): DurationFields {
  const fields = zeroDuration()
  for (let i = largest; i < durationFieldNames.length; i++) {
    fields[durationFieldNames[i]] = Number(value / timeFactors[i - 3]) || 0
    value %= timeFactors[i - 3]
  }
  return validateDuration(fields)
}
export function largestDurationField(fields: DurationFields): number {
  const index = durationFieldNames.findIndex(key => fields[key] !== 0)
  return index < 0 ? 9 : index
}

// Round the exact ratio once; converting the numerator first loses low bits.
export function durationTotalNumber(
  nanoseconds: bigint,
  divisor: bigint
): number {
  if (nanoseconds === 0n) return 0
  const negative = nanoseconds < 0n
  const absolute = negative ? -nanoseconds : nanoseconds
  let exponent = absolute.toString(2).length - divisor.toString(2).length
  if (
    exponent >= 0
      ? absolute < divisor << BigInt(exponent)
      : absolute << BigInt(-exponent) < divisor
  )
    exponent--
  const shift = 52 - exponent
  const numerator = shift >= 0 ? absolute << BigInt(shift) : absolute
  const denominator = shift >= 0 ? divisor : divisor << BigInt(-shift)
  let mantissa = numerator / denominator
  const remainder = numerator % denominator
  if (
    remainder * 2n > denominator ||
    (remainder * 2n === denominator && mantissa % 2n !== 0n)
  )
    mantissa++
  const value = Number(mantissa) * 2 ** (exponent - 52)
  return negative ? -value : value
}
