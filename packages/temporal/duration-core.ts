import {
  RangeErrorConstructor,
  TypeErrorConstructor,
  bigIntFrom,
  mathAbs,
  numberFrom,
  numberIsInteger,
} from '#packages/ecma262-abstract/intrinsics.js'
import {IsObject} from '#packages/ecma262-abstract/IsObject.js'
import {createObject} from '#packages/temporal/intrinsics.js'
import {nativeTemporal} from '#packages/temporal/native.js'
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
export const durationFieldReadOrder = [
  'days',
  'hours',
  'microseconds',
  'milliseconds',
  'minutes',
  'months',
  'nanoseconds',
  'seconds',
  'weeks',
  'years',
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
  for (let index = 0; index < durationFieldNames.length; index++) {
    const key = durationFieldNames[index]
    if (fields[key] < 0) return -1
    if (fields[key] > 0) return 1
  }
  return 0
}
// https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/duration.html#L1327-L1333
// Time-only terms expand the component fold; optional days are separate.
// L1327: an hour contributes 60 minutes.
// L1328: a minute contributes 60 seconds.
// L1329: a second contributes 1000 milliseconds.
// L1330: a millisecond contributes 1000 microseconds.
// L1331: a microsecond contributes 1000 nanoseconds.
// L1333: return the exact integer sum. Caller-bound assertion L1332 remains open.
export function durationNanoseconds(
  fields: DurationFields,
  includeDays = true
): bigint {
  let value = 0n
  for (let i = includeDays ? 3 : 4; i < durationFieldNames.length; i++)
    value += bigIntFrom(fields[durationFieldNames[i]]) * timeFactors[i - 3]
  return value
}
export function validateDuration(fields: DurationFields): DurationFields {
  const sign = durationSign(fields)
  for (let index = 0; index < durationFieldNames.length; index++) {
    const key = durationFieldNames[index]
    const value = fields[key]
    if (
      !numberIsInteger(value) ||
      (value !== 0 && (value < 0 ? -1 : 1) !== sign)
    )
      throw new RangeErrorConstructor('Invalid duration fields')
    fields[key] = value || 0
  }
  if (
    mathAbs(fields.years) >= 4294967296 ||
    mathAbs(fields.months) >= 4294967296 ||
    mathAbs(fields.weeks) >= 4294967296
  )
    throw new RangeErrorConstructor('Calendar duration out of range')
  const time = durationNanoseconds(fields)
  if (time <= -maxDurationNanoseconds || time >= maxDurationNanoseconds)
    throw new RangeErrorConstructor('Duration out of range')
  return fields
}
export function integralDurationNumber(value: unknown): number {
  const number = +(value as number)
  if (!numberIsInteger(number))
    throw new RangeErrorConstructor('Duration fields must be integral')
  return number || 0
}
export function partialDuration(value: unknown): Partial<DurationFields> {
  if (!IsObject(value))
    throw new TypeErrorConstructor('Duration fields must be an object')
  const result: Partial<DurationFields> = createObject(null)
  let found = false
  for (let index = 0; index < durationFieldReadOrder.length; index++) {
    const field = durationFieldReadOrder[index]
    const number = (value as Record<string, unknown>)[field]
    if (number !== undefined) {
      result[field] = integralDurationNumber(number)
      found = true
    }
  }
  if (!found) throw new TypeErrorConstructor('Duration fields required')
  return result
}
export function parseDurationString(value: string): DurationFields {
  const native = nativeTemporal()
  if (import.meta.formatjsTemporalNativeData === true || native)
    return native!.parseDuration(value)
  const invalid = (): never => {
    throw new RangeErrorConstructor('Invalid duration string')
  }
  let index = 0
  const first = value.length === 0 ? '' : value[0]
  const negative = first === '-'
  if (negative || first === '+') index++
  if (index >= value.length || (value[index] !== 'P' && value[index] !== 'p'))
    invalid()
  index++
  const result = zeroDuration()
  let inTime = false
  let found = false
  let nextField = 0
  let extra = 0n
  while (index < value.length) {
    if (value[index] === 'T' || value[index] === 't') {
      if (inTime || index + 1 === value.length) invalid()
      inTime = true
      nextField = 4
      index++
      continue
    }
    const start = index
    let whole = 0
    while (index < value.length && value[index] >= '0' && value[index] <= '9') {
      whole = whole * 10 + +value[index]
      index++
    }
    if (index === start) invalid()
    let fraction = 0
    let digits = 0
    if (
      index < value.length &&
      (value[index] === '.' || value[index] === ',')
    ) {
      index++
      while (
        index < value.length &&
        value[index] >= '0' &&
        value[index] <= '9'
      ) {
        if (digits === 9) invalid()
        fraction = fraction * 10 + +value[index]
        digits++
        index++
      }
      if (digits === 0) invalid()
      for (let padded = digits; padded < 9; padded++) fraction *= 10
    }
    if (index === value.length) return invalid()
    const unit = value[index++]
    const field = inTime
      ? unit === 'H' || unit === 'h'
        ? 4
        : unit === 'M' || unit === 'm'
          ? 5
          : unit === 'S' || unit === 's'
            ? 6
            : -1
      : unit === 'Y' || unit === 'y'
        ? 0
        : unit === 'M' || unit === 'm'
          ? 1
          : unit === 'W' || unit === 'w'
            ? 2
            : unit === 'D' || unit === 'd'
              ? 3
              : -1
    if (field === -1 || field < nextField) return invalid()
    if (digits !== 0 && (!inTime || index !== value.length)) invalid()
    result[durationFieldNames[field]] = whole
    nextField = field + 1
    found = true
    if (digits !== 0)
      extra =
        bigIntFrom(fraction) * (field === 4 ? 3600n : field === 5 ? 60n : 1n)
  }
  if (!found) invalid()
  result.minutes += numberFrom(extra / 60_000_000_000n)
  extra %= 60_000_000_000n
  result.seconds += numberFrom(extra / 1_000_000_000n)
  extra %= 1_000_000_000n
  result.milliseconds = numberFrom(extra / 1_000_000n)
  result.microseconds = numberFrom((extra / 1000n) % 1000n)
  result.nanoseconds = numberFrom(extra % 1000n)
  if (negative)
    for (let index = 0; index < durationFieldNames.length; index++) {
      const field = durationFieldNames[index]
      result[field] = -result[field] || 0
    }
  return validateDuration(result)
}
export function balanceDurationTime(
  value: bigint,
  largest: number
): DurationFields {
  const fields = zeroDuration()
  for (let i = largest; i < durationFieldNames.length; i++) {
    fields[durationFieldNames[i]] = numberFrom(value / timeFactors[i - 3]) || 0
    value %= timeFactors[i - 3]
  }
  return validateDuration(fields)
}
export function largestDurationField(fields: DurationFields): number {
  for (let index = 0; index < durationFieldNames.length; index++)
    if (fields[durationFieldNames[index]] !== 0) return index
  return 9
}

const durationBigIntToString = BigInt.prototype.toString
const durationApply = Reflect.apply

// Round the exact ratio once; converting the numerator first loses low bits.
export function durationTotalNumber(
  nanoseconds: bigint,
  divisor: bigint
): number {
  if (nanoseconds === 0n) return 0
  const negative = nanoseconds < 0n
  const absolute = negative ? -nanoseconds : nanoseconds
  let exponent =
    durationApply(durationBigIntToString, absolute, [2]).length -
    durationApply(durationBigIntToString, divisor, [2]).length
  if (
    exponent >= 0
      ? absolute < divisor << bigIntFrom(exponent)
      : absolute << bigIntFrom(-exponent) < divisor
  )
    exponent--
  const shift = 52 - exponent
  const numerator = shift >= 0 ? absolute << bigIntFrom(shift) : absolute
  const denominator = shift >= 0 ? divisor : divisor << bigIntFrom(-shift)
  let mantissa = numerator / denominator
  const remainder = numerator % denominator
  if (
    remainder * 2n > denominator ||
    (remainder * 2n === denominator && mantissa % 2n !== 0n)
  )
    mantissa++
  const value = numberFrom(mantissa) * 2 ** (exponent - 52)
  return negative ? -value : value
}
