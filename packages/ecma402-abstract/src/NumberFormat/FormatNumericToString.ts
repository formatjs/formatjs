import SameValue from 'es-abstract/5/SameValue';
import {ToRawPrecision} from './ToRawPrecision';
import {repeat} from '../utils';
import {
  NumberFormatDigitInternalSlots,
  RawNumberFormatResult,
} from '../../types/number';
import {ToRawFixed} from './ToRawFixed';

/**
 * https://tc39.es/ecma402/#sec-formatnumberstring
 */
export function FormatNumericToString(
  intlObject: Pick<
    NumberFormatDigitInternalSlots,
    | 'roundingType'
    | 'minimumSignificantDigits'
    | 'maximumSignificantDigits'
    | 'minimumIntegerDigits'
    | 'minimumFractionDigits'
    | 'maximumFractionDigits'
  >,
  x: number
) {
  const isNegative = x < 0 || SameValue(x, -0);
  if (isNegative) {
    x = -x;
  }

  let result: RawNumberFormatResult;

  const rourndingType = intlObject.roundingType;

  switch (rourndingType) {
    case 'significantDigits':
      result = ToRawPrecision(
        x,
        intlObject.minimumSignificantDigits!,
        intlObject.maximumSignificantDigits!
      );
      break;
    case 'fractionDigits':
      result = ToRawFixed(
        x,
        intlObject.minimumFractionDigits!,
        intlObject.maximumFractionDigits!
      );
      break;
    default:
      result = ToRawPrecision(x, 1, 2);
      if (result.integerDigitsCount > 1) {
        result = ToRawFixed(x, 0, 0);
      }
      break;
  }

  x = result.roundedNumber;
  let string = result.formattedString;
  const int = result.integerDigitsCount;
  const minInteger = intlObject.minimumIntegerDigits;

  if (int < minInteger) {
    const forwardZeros = repeat('0', minInteger - int);
    string = forwardZeros + string;
  }

  if (isNegative) {
    x = -x;
  }
  return {roundedNumber: x, formattedString: string};
}
