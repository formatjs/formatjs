import {Decimal} from '@formatjs/bigdecimal'

const powersOfTen = new Map<number, Decimal>()

export function getPowerOf10(exponent: number | Decimal): Decimal {
  const n = typeof exponent === 'number' ? exponent : exponent.toNumber()
  const cached = powersOfTen.get(n)
  if (cached !== undefined) return cached
  const power = Decimal.pow(10, n)
  // Retain common Number scales; unusual exponents stay uncached.
  if (Number.isInteger(n) && n >= -324 && n <= 324) {
    powersOfTen.set(n, power)
  }
  return power
}
