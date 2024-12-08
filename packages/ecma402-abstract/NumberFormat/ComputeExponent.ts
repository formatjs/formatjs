import Decimal from 'decimal.js'
import {TEN} from '../constants'
import {NumberFormatInternal} from '../types/number'
import {ComputeExponentForMagnitude} from './ComputeExponentForMagnitude'
import {FormatNumericToString} from './FormatNumericToString'
/**
 * The abstract operation ComputeExponent computes an exponent (power of ten) by which to scale x
 * according to the number formatting settings. It handles cases such as 999 rounding up to 1000,
 * requiring a different exponent.
 *
 * NOT IN SPEC: it returns [exponent, magnitude].
 */
export function ComputeExponent(
  numberFormat: Intl.NumberFormat,
  x: Decimal,
  {
    getInternalSlots,
  }: {getInternalSlots(nf: Intl.NumberFormat): NumberFormatInternal}
): [number, number] {
  if (x.isZero()) {
    return [0, 0]
  }
  if (x.isNegative()) {
    x = x.negated()
  }
  const magnitude = x.log(10).floor()
  const exponent = ComputeExponentForMagnitude(numberFormat, magnitude, {
    getInternalSlots,
  })
  // Preserve more precision by doing multiplication when exponent is negative.
  x = x.times(TEN.pow(-exponent))
  const formatNumberResult = FormatNumericToString(
    getInternalSlots(numberFormat),
    x
  )
  if (formatNumberResult.roundedNumber.isZero()) {
    return [exponent, magnitude.toNumber()]
  }
  const newMagnitude = formatNumberResult.roundedNumber.log(10).floor()
  if (newMagnitude.eq(magnitude.minus(exponent))) {
    return [exponent, magnitude.toNumber()]
  }
  return [
    ComputeExponentForMagnitude(numberFormat, magnitude.plus(1), {
      getInternalSlots,
    }),
    magnitude.plus(1).toNumber(),
  ]
}
