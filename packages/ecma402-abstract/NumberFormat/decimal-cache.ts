import {Decimal} from 'decimal.js'
import {memoize} from '@formatjs/fast-memoize'

/**
 * Cached function to compute powers of 10 for Decimal.js operations.
 * This cache significantly reduces overhead in ComputeExponent and ToRawFixed
 * by memoizing expensive Decimal.pow(10, n) calculations.
 *
 * Common exponents (e.g., -20 to 20) are used repeatedly in number formatting,
 * so caching provides substantial performance benefits.
 *
 * @param exponent - Can be a number or Decimal. If Decimal, it will be converted to string for cache key.
 */
export const getPowerOf10: (exponent: number | Decimal) => Decimal = memoize(
  (exponent: number | Decimal): Decimal => {
    return Decimal.pow(10, exponent)
  }
)
