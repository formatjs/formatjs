import {Decimal} from '@formatjs/bigdecimal'
import {type NumberFormatInternal} from '#packages/ecma402-abstract/types/number.js'
import {ComputeExponentForMagnitude} from '#packages/ecma402-abstract/NumberFormat/ComputeExponentForMagnitude.js'
import {FormatNumericToString} from '#packages/ecma402-abstract/NumberFormat/FormatNumericToString.js'
import {getPowerOf10} from '#packages/ecma402-abstract/NumberFormat/decimal-cache.js'

function decimalMagnitude(value: Decimal): Decimal {
  // The positive mantissa's digit count gives floor(log10(value)) exactly.
  return new Decimal(`${value._mantissa}`.length - 1 + value._exponent)
}

// Return the exponent, magnitude, and reusable positive rounding preview.
// ECMA-402 §16.5.12 https://tc39.es/ecma402/#sec-computeexponent
export function ComputeExponent(
  internalSlots: NumberFormatInternal,
  x: Decimal
): [number, number, ReturnType<typeof FormatNumericToString>?] {
  if (x.isZero()) {
    return [0, 0]
  }
  const negative = x.isNegative()
  if (negative) {
    x = x.negated()
  }

  const magnitude = decimalMagnitude(x)
  const exponent = ComputeExponentForMagnitude(internalSlots, magnitude)
  // Preserve more precision by doing multiplication when exponent is negative.
  x = x.times(getPowerOf10(-exponent))
  const formatNumberResult = FormatNumericToString(internalSlots, x)
  // Negative inputs can use different directed rounding in the final pass.
  const preview = negative ? undefined : formatNumberResult
  if (formatNumberResult.roundedNumber.isZero()) {
    return [exponent, magnitude.toNumber(), preview]
  }

  const newMagnitude = decimalMagnitude(formatNumberResult.roundedNumber)
  if (newMagnitude.eq(magnitude.minus(exponent))) {
    return [exponent, magnitude.toNumber(), preview]
  }
  const nextMagnitude = magnitude.plus(1)
  const nextExponent = ComputeExponentForMagnitude(internalSlots, nextMagnitude)
  return [
    nextExponent,
    nextMagnitude.toNumber(),
    nextExponent === exponent ? preview : undefined,
  ]
}
