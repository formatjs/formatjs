import {Decimal} from 'decimal.js'
import {DecimalFormatNum, NumberFormatInternal} from '../types/number.js'
import {invariant} from '../utils.js'
import {getPowerOf10} from './decimal-cache.js'
Decimal.set({
  toExpPos: 100,
})
/**
 * The abstract operation ComputeExponentForMagnitude computes an exponent by which to scale a
 * number of the given magnitude (power of ten of the most significant digit) according to the
 * locale and the desired notation (scientific, engineering, or compact).
 */
export function ComputeExponentForMagnitude(
  internalSlots: NumberFormatInternal,
  magnitude: Decimal
): number {
  const {notation, dataLocaleData, numberingSystem} = internalSlots

  switch (notation) {
    case 'standard':
      return 0
    case 'scientific':
      return magnitude.toNumber()
    case 'engineering':
      const thousands = magnitude.div(3).floor()
      return thousands.times(3).toNumber()
    default: {
      invariant(notation === 'compact', 'Invalid notation')
      // Let exponent be an implementation- and locale-dependent (ILD) integer by which to scale a
      // number of the given magnitude in compact notation for the current locale.
      const {compactDisplay, style, currencyDisplay} = internalSlots
      let thresholdMap
      if (style === 'currency' && currencyDisplay !== 'name') {
        const currency =
          dataLocaleData.numbers.currency[numberingSystem] ||
          dataLocaleData.numbers.currency[dataLocaleData.numbers.nu[0]]
        thresholdMap = currency.short
      } else {
        const decimal =
          dataLocaleData.numbers.decimal[numberingSystem] ||
          dataLocaleData.numbers.decimal[dataLocaleData.numbers.nu[0]]
        thresholdMap = compactDisplay === 'long' ? decimal.long : decimal.short
      }
      if (!thresholdMap) {
        return 0
      }
      const num = getPowerOf10(magnitude).toString() as DecimalFormatNum
      const thresholds = Object.keys(thresholdMap) as DecimalFormatNum[] // TODO: this can be pre-processed
      if (num < thresholds[0]) {
        return 0
      }
      if (num > thresholds[thresholds.length - 1]) {
        return thresholds[thresholds.length - 1].length - 1
      }
      const i = thresholds.indexOf(num)
      if (i === -1) {
        return 0
      }
      // See https://unicode.org/reports/tr35/tr35-numbers.html#Compact_Number_Formats
      // Special handling if the pattern is precisely `0`.
      const magnitudeKey = thresholds[i]
      // TODO: do we need to handle plural here?
      const compactPattern = thresholdMap[magnitudeKey].other
      if (compactPattern === '0') {
        return 0
      }
      // Example: in zh-TW, `10000000` maps to `0000萬`. So we need to return 8 - 4 = 4 here.
      return (
        magnitudeKey.length -
        thresholdMap[magnitudeKey].other.match(/0+/)![0].length
      )
    }
  }
}
