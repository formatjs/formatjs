import {Decimal} from '@formatjs/bigdecimal'
import {type NumberFormatInternal} from '#packages/ecma402-abstract/types/number.js'
import {ComputeExponentForMagnitude} from '#packages/ecma402-abstract/NumberFormat/ComputeExponentForMagnitude.js'
import {FormatNumericToString} from '#packages/ecma402-abstract/NumberFormat/FormatNumericToString.js'
import {getPowerOf10} from '#packages/ecma402-abstract/NumberFormat/decimal-cache.js'

/**
 * The abstract operation ComputeExponent computes an exponent (power of ten) by which to scale x
 * according to the number formatting settings. It handles cases such as 999 rounding up to 1000,
 * requiring a different exponent.
 *
 * NOT IN SPEC: returns magnitude and reusable positive rounding when scaling is unchanged.
 */
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

  // Fast path for simple numbers
  // If x can be represented as a safe integer, use native Math.log10
  const xNum = x.toNumber()
  let magnitude: Decimal
  if (
    Number.isFinite(xNum) &&
    Number.isSafeInteger(xNum) &&
    xNum > 0 &&
    xNum <= 999999
  ) {
    // Use fast native logarithm for simple positive integers
    const magNum = Math.floor(Math.log10(xNum))
    magnitude = new Decimal(magNum)
  } else {
    magnitude = x.log(10).floor()
  }
  const exponent = ComputeExponentForMagnitude(internalSlots, magnitude)
  // Preserve more precision by doing multiplication when exponent is negative.
  x = x.times(getPowerOf10(-exponent))
  const formatNumberResult = FormatNumericToString(internalSlots, x)
  // Negative inputs can use different directed rounding in the final pass.
  const preview = negative ? undefined : formatNumberResult
  if (formatNumberResult.roundedNumber.isZero()) {
    return [exponent, magnitude.toNumber(), preview]
  }

  // Fast path for simple rounded numbers
  const roundedNum = formatNumberResult.roundedNumber.toNumber()
  let newMagnitude: Decimal
  if (
    Number.isFinite(roundedNum) &&
    Number.isSafeInteger(roundedNum) &&
    roundedNum > 0 &&
    roundedNum <= 999999
  ) {
    const newMagNum = Math.floor(Math.log10(roundedNum))
    newMagnitude = new Decimal(newMagNum)
  } else {
    newMagnitude = formatNumberResult.roundedNumber.log(10).floor()
  }
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
