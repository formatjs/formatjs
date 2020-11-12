import {getMagnitude} from '../utils';
import {ComputeExponentForMagnitude} from './ComputeExponentForMagnitude';
import {FormatNumericToString} from './FormatNumericToString';
import {NumberFormatInternal} from '../types/number';

/**
 * The abstract operation ComputeExponent computes an exponent (power of ten) by which to scale x
 * according to the number formatting settings. It handles cases such as 999 rounding up to 1000,
 * requiring a different exponent.
 *
 * NOT IN SPEC: it returns [exponent, magnitude].
 */
export function ComputeExponent(
  numberFormat: Intl.NumberFormat,
  x: number,
  {
    getInternalSlots,
  }: {getInternalSlots(nf: Intl.NumberFormat): NumberFormatInternal}
): [number, number] {
  if (x === 0) {
    return [0, 0];
  }
  if (x < 0) {
    x = -x;
  }
  const magnitude = getMagnitude(x);
  const exponent = ComputeExponentForMagnitude(numberFormat, magnitude, {
    getInternalSlots,
  });
  // Preserve more precision by doing multiplication when exponent is negative.
  x = exponent < 0 ? x * 10 ** -exponent : x / 10 ** exponent;
  const formatNumberResult = FormatNumericToString(
    getInternalSlots(numberFormat),
    x
  );
  if (formatNumberResult.roundedNumber === 0) {
    return [exponent, magnitude];
  }
  const newMagnitude = getMagnitude(formatNumberResult.roundedNumber);
  if (newMagnitude === magnitude - exponent) {
    return [exponent, magnitude];
  }
  return [
    ComputeExponentForMagnitude(numberFormat, magnitude + 1, {
      getInternalSlots,
    }),
    magnitude + 1,
  ];
}
