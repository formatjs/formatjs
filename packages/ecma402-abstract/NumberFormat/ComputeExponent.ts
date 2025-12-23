import {Decimal} from 'decimal.js'
import {NumberFormatInternal} from '../types/number.js'
import {ComputeExponentForMagnitude} from './ComputeExponentForMagnitude.js'
import {FormatNumericToString} from './FormatNumericToString.js'
import {getPowerOf10} from './decimal-cache.js'

/**
 * The abstract operation ComputeExponent computes an exponent (power of ten) by which to scale x
 * according to the number formatting settings. It handles cases such as 999 rounding up to 1000,
 * requiring a different exponent.
 *
 * NOT IN SPEC: it returns [exponent, magnitude].
 */
export function ComputeExponent(
  internalSlots: NumberFormatInternal,
  x: Decimal
): [number, number] {
  if (x.isZero()) {
    return [0, 0]
  }
  if (x.isNegative()) {
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
  if (formatNumberResult.roundedNumber.isZero()) {
    return [exponent, magnitude.toNumber()]
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
    return [exponent, magnitude.toNumber()]
  }
  return [
    ComputeExponentForMagnitude(internalSlots, magnitude.plus(1)),
    magnitude.plus(1).toNumber(),
  ]
}
