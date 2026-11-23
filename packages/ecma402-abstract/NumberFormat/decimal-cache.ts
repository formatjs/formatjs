import {Decimal} from '@formatjs/bigdecimal'
import {numberIsInteger} from '#packages/ecma262-abstract/intrinsics.js'

const powersOfTen = new Map<number, Decimal>()
const readPower = powersOfTen.get.bind(powersOfTen)
const storePower = powersOfTen.set.bind(powersOfTen)
const powerOf = Decimal.pow

export function getPowerOf10(exponent: number | Decimal): Decimal {
  const n = typeof exponent === 'number' ? exponent : exponent.toNumber()
  const cached = readPower(n)
  if (cached !== undefined) return cached
  const power = powerOf(10, n)
  // Retain common Number scales; unusual exponents stay uncached.
  if (numberIsInteger(n) && n >= -324 && n <= 324) {
    storePower(n, power)
  }
  return power
}
