import type {Decimal} from 'decimal.js'
import {NEGATIVE_ZERO, ZERO} from '../constants.js'
import {
  type NumberFormatDigitInternalSlots,
  type RawNumberFormatResult,
} from '../types/number.js'
import {invariant, repeat} from '../utils.js'
import {GetUnsignedRoundingMode} from './GetUnsignedRoundingMode.js'
import {ToRawFixed} from './ToRawFixed.js'
import {ToRawPrecision} from './ToRawPrecision.js'

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
    | 'roundingIncrement'
    | 'roundingMode'
    | 'trailingZeroDisplay'
  >,
  _x: Decimal
): {
  roundedNumber: Decimal
  formattedString: string
} {
  let x = _x
  let sign
  // -0
  if (x.isZero() && x.isNegative()) {
    sign = 'negative'
    x = ZERO
  } else {
    invariant(
      x.isFinite(),
      'NumberFormatDigitInternalSlots value is not finite'
    )
    if (x.lessThan(0)) {
      sign = 'negative'
    } else {
      sign = 'positive'
    }
    if (sign === 'negative') {
      x = x.negated()
    }
  }

  let result: RawNumberFormatResult

  const roundingType = intlObject.roundingType
  const unsignedRoundingMode = GetUnsignedRoundingMode(
    intlObject.roundingMode,
    sign === 'negative'
  )

  switch (roundingType) {
    case 'significantDigits':
      result = ToRawPrecision(
        x,
        intlObject.minimumSignificantDigits,
        intlObject.maximumSignificantDigits,
        unsignedRoundingMode
      )
      break
    case 'fractionDigits':
      result = ToRawFixed(
        x,
        intlObject.minimumFractionDigits,
        intlObject.maximumFractionDigits,
        intlObject.roundingIncrement,
        unsignedRoundingMode
      )
      break
    default:
      let sResult = ToRawPrecision(
        x,
        intlObject.minimumSignificantDigits,
        intlObject.maximumSignificantDigits,
        unsignedRoundingMode
      )
      let fResult = ToRawFixed(
        x,
        intlObject.minimumFractionDigits,
        intlObject.maximumFractionDigits,
        intlObject.roundingIncrement,
        unsignedRoundingMode
      )
      if (intlObject.roundingType === 'morePrecision') {
        if (sResult.roundingMagnitude <= fResult.roundingMagnitude) {
          result = sResult
        } else {
          result = fResult
        }
      } else {
        invariant(
          intlObject.roundingType === 'lessPrecision',
          'Invalid roundingType'
        )
        if (sResult.roundingMagnitude <= fResult.roundingMagnitude) {
          result = fResult
        } else {
          result = sResult
        }
      }
      break
  }

  x = result.roundedNumber
  let string = result.formattedString
  if (intlObject.trailingZeroDisplay === 'stripIfInteger' && x.isInteger()) {
    let i = string.indexOf('.')
    if (i > -1) {
      string = string.slice(0, i)
    }
  }
  const int = result.integerDigitsCount
  const minInteger = intlObject.minimumIntegerDigits

  if (int < minInteger) {
    const forwardZeros = repeat('0', minInteger - int)
    string = forwardZeros + string
  }

  if (sign === 'negative') {
    if (x.isZero()) {
      x = NEGATIVE_ZERO
    } else {
      x = x.negated()
    }
  }
  return {roundedNumber: x, formattedString: string}
}
