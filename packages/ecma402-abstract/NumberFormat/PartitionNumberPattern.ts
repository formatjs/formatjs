import {NumberFormatInternal} from '../types/number'
import {FormatNumericToString} from './FormatNumericToString'
import {SameValue} from '../262'
import {ComputeExponent} from './ComputeExponent'
import formatToParts from './format_to_parts'

/**
 * https://tc39.es/ecma402/#sec-formatnumberstring
 */
export function PartitionNumberPattern(
  numberFormat: Intl.NumberFormat,
  x: number,
  {
    getInternalSlots,
  }: {
    getInternalSlots(nf: Intl.NumberFormat): NumberFormatInternal
  }
) {
  const internalSlots = getInternalSlots(numberFormat)
  const {pl, dataLocaleData, numberingSystem} = internalSlots
  const symbols =
    dataLocaleData.numbers.symbols[numberingSystem] ||
    dataLocaleData.numbers.symbols[dataLocaleData.numbers.nu[0]]

  let magnitude = 0
  let exponent = 0
  let n: string

  if (isNaN(x)) {
    n = symbols.nan
  } else if (x == Number.POSITIVE_INFINITY) {
    n = symbols.positiveInfinity
  } else if (x == Number.NEGATIVE_INFINITY) {
    n = symbols.negativeInfinity
  } else {
    if (!SameValue(x, -0)) {
      if (!isFinite(x)) {
        throw new Error('Input must be a mathematical number')
      }
      if (internalSlots.style == 'percent') {
        x = x * 100
      }
      const [exponent] = ComputeExponent(numberFormat, x, {getInternalSlots})
      x = x * Math.pow(10, -exponent)
    }
    // Preserve more precision by doing multiplication when exponent is negative.
    x = exponent < 0 ? x * 10 ** -exponent : x / 10 ** exponent
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
      if (SameValue(x, 0) || x > 0 || isNaN(x)) {
        sign = 0
      } else {
        sign = -1
      }
      break
    case 'always':
      if (SameValue(x, 0) || x > 0 || isNaN(x)) {
        sign = 1
      } else {
        sign = -1
      }
      break
    default:
      // x === 0 -> x is 0 or x is -0
      if (x === 0 || isNaN(x)) {
        sign = 0
      } else if (x > 0) {
        sign = 1
      } else {
        sign = -1
      }
  }

  return formatToParts(
    {roundedNumber: x, formattedString: n, exponent, magnitude, sign},
    internalSlots.dataLocaleData,
    pl,
    internalSlots
  )
}
