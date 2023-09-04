import {NumberFormatInternal, NumberFormatPart} from '../types/number'

/**
 * https://tc39.es/ecma402/#sec-formatapproximately
 */
export function FormatApproximately(
  numberFormat: Intl.NumberFormat,
  result: NumberFormatPart[],
  {
    getInternalSlots,
  }: {
    getInternalSlots(nf: Intl.NumberFormat): NumberFormatInternal
  }
) {
  const internalSlots = getInternalSlots(numberFormat)

  const symbols =
    internalSlots.dataLocaleData.numbers.symbols[internalSlots.numberingSystem]

  const approximatelySign = symbols.approximatelySign

  result.push({type: 'approximatelySign', value: approximatelySign})
  return result
}
