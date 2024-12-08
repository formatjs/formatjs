import Decimal from 'decimal.js'
import {TEN} from '../constants'
import {NumberFormatInternal, NumberFormatPart} from '../types/number'
import {invariant} from '../utils'
import {ComputeExponent} from './ComputeExponent'
import formatToParts from './format_to_parts'
import {FormatNumericToString} from './FormatNumericToString'

/**
 * https://tc39.es/ecma402/#sec-formatnumberstring
 */
export function PartitionNumberPattern(
  numberFormat: Intl.NumberFormat,
  x: Decimal,
  {
    getInternalSlots,
  }: {
    getInternalSlots(nf: Intl.NumberFormat): NumberFormatInternal
  }
): NumberFormatPart[] {
  const internalSlots = getInternalSlots(numberFormat)
  const {pl, dataLocaleData, numberingSystem} = internalSlots
  const symbols =
    dataLocaleData.numbers.symbols[numberingSystem] ||
    dataLocaleData.numbers.symbols[dataLocaleData.numbers.nu[0]]

  let magnitude = 0
  let exponent = 0
  let n: string

  if (x.isNaN()) {
    n = symbols.nan
  } else if (!x.isFinite()) {
    n = symbols.infinity
  } else {
    if (!x.isZero()) {
      invariant(x.isFinite(), 'Input must be a mathematical value')
      if (internalSlots.style == 'percent') {
        x = x.times(100)
      }
      ;[exponent, magnitude] = ComputeExponent(numberFormat, x, {
        getInternalSlots,
      })
      x = x.times(TEN.pow(-exponent))
    }
    const formatNumberResult = FormatNumericToString(internalSlots, x)
    n = formatNumberResult.formattedString
    x = formatNumberResult.roundedNumber
  }

  // Based on https://tc39.es/ecma402/#sec-getnumberformatpattern
  // We need to do this before `x` is rounded.
  let sign: -1 | 0 | 1
  const signDisplay = internalSlots.signDisplay
  switch (signDisplay) {
    case 'never':
      sign = 0
      break
    case 'auto':
      if (x.isPositive() || x.isNaN()) {
        sign = 0
      } else {
        sign = -1
      }
      break
    case 'always':
      if (x.isPositive() || x.isNaN()) {
        sign = 1
      } else {
        sign = -1
      }
      break
    case 'exceptZero':
      if (x.isZero()) {
        sign = 0
      } else if (x.isNegative()) {
        sign = -1
      } else {
        sign = 1
      }
      break
    default:
      invariant(signDisplay === 'negative', 'signDisplay must be "negative"')
      if (x.isNegative() && !x.isZero()) {
        sign = -1
      } else {
        sign = 0
      }
      break
  }

  return formatToParts(
    {roundedNumber: x, formattedString: n, exponent, magnitude, sign},
    internalSlots.dataLocaleData,
    pl,
    internalSlots
  )
}
