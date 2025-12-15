import {Decimal} from 'decimal.js'
import {NumberFormatInternal} from '../types/number.js'
import {ComputeExponentForMagnitude} from './ComputeExponentForMagnitude.js'
import {FormatNumericToString} from './FormatNumericToString.js'
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
  const magnitude = x.log(10).floor()
  const exponent = ComputeExponentForMagnitude(internalSlots, magnitude)
  // Preserve more precision by doing multiplication when exponent is negative.
  x = x.times(Decimal.pow(10, -exponent))
  const formatNumberResult = FormatNumericToString(internalSlots, x)
  if (formatNumberResult.roundedNumber.isZero()) {
    return [exponent, magnitude.toNumber()]
  }
  const newMagnitude = formatNumberResult.roundedNumber.log(10).floor()
  if (newMagnitude.eq(magnitude.minus(exponent))) {
    return [exponent, magnitude.toNumber()]
  }
  return [
    ComputeExponentForMagnitude(internalSlots, magnitude.plus(1)),
    magnitude.plus(1).toNumber(),
  ]
}
