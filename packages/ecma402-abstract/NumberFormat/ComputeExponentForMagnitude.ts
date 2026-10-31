import type {Decimal} from '@formatjs/bigdecimal'
import {type NumberFormatInternal} from '#packages/ecma402-abstract/types/number.js'
import {invariant} from '#packages/ecma402-abstract/utils.js'
import {getCompactPattern} from '#packages/ecma402-abstract/NumberFormat/compact-patterns.js'
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
      return (
        getCompactPattern(thresholdMap, magnitude.toNumber())?.exponent ?? 0
      )
    }
  }
}
