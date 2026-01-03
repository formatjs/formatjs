import {
  type NumberFormatInternal,
  type NumberFormatPart,
} from '../types/number.js'

/**
 * https://tc39.es/ecma402/#sec-formatapproximately
 */
export function FormatApproximately(
  internalSlots: NumberFormatInternal,
  result: NumberFormatPart[]
): NumberFormatPart[] {
  const symbols =
    internalSlots.dataLocaleData.numbers.symbols[internalSlots.numberingSystem]

  const approximatelySign = symbols.approximatelySign

  result.push({type: 'approximatelySign', value: approximatelySign})
  return result
}
