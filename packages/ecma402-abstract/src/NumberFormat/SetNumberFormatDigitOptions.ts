import {
  NumberFormatDigitOptions,
  NumberFormatNotation,
  NumberFormatDigitInternalSlots,
} from '../../types/number';
import {GetNumberOption} from '../GetNumberOption';
import {DefaultNumberOption} from '../DefaultNumberOption';

/**
 * https://tc39.es/ecma402/#sec-setnfdigitoptions
 */
export function SetNumberFormatDigitOptions(
  internalSlots: NumberFormatDigitInternalSlots,
  opts: NumberFormatDigitOptions,
  mnfdDefault: number,
  mxfdDefault: number,
  notation: NumberFormatNotation
) {
  const mnid = GetNumberOption(opts, 'minimumIntegerDigits', 1, 21, 1);
  let mnfd = opts.minimumFractionDigits;
  let mxfd = opts.maximumFractionDigits;
  let mnsd = opts.minimumSignificantDigits;
  let mxsd = opts.maximumSignificantDigits;
  internalSlots.minimumIntegerDigits = mnid;
  if (mnsd !== undefined || mxsd !== undefined) {
    internalSlots.roundingType = 'significantDigits';
    mnsd = DefaultNumberOption(mnsd, 1, 21, 1);
    mxsd = DefaultNumberOption(mxsd, mnsd, 21, 21);
    internalSlots.minimumSignificantDigits = mnsd;
    internalSlots.maximumSignificantDigits = mxsd;
  } else if (mnfd !== undefined || mxfd !== undefined) {
    internalSlots.roundingType = 'fractionDigits';
    mnfd = DefaultNumberOption(mnfd, 0, 20, mnfdDefault);
    const mxfdActualDefault = Math.max(mnfd, mxfdDefault);
    mxfd = DefaultNumberOption(mxfd, mnfd, 20, mxfdActualDefault);
    internalSlots.minimumFractionDigits = mnfd;
    internalSlots.maximumFractionDigits = mxfd;
  } else if (notation === 'compact') {
    internalSlots.roundingType = 'compactRounding';
  } else {
    internalSlots.roundingType = 'fractionDigits';
    internalSlots.minimumFractionDigits = mnfdDefault;
    internalSlots.maximumFractionDigits = mxfdDefault;
  }
}
