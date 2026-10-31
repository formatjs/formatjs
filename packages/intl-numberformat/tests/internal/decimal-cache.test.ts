import {expect, it} from 'vitest'
import {Decimal} from '@formatjs/bigdecimal'
import {getPowerOf10} from '#packages/ecma402-abstract/NumberFormat/decimal-cache.js'

it('shares equivalent integer exponents across Number and Decimal inputs', () => {
  for (const exponent of [-324, -100, -1, 0, 1, 100, 324]) {
    const power = getPowerOf10(exponent)
    expect(getPowerOf10(new Decimal(exponent))).toBe(power)
    expect(getPowerOf10(new Decimal(`${exponent}.00`))).toBe(power)
    expect(power.eq(Decimal.pow(10, exponent))).toBe(true)
  }
  expect(getPowerOf10(-0)).toBe(getPowerOf10(0))
  expect(getPowerOf10(new Decimal('-0'))).toBe(getPowerOf10(0))
})

it('delegates unusual scales without retaining entries or changing coercion', () => {
  for (const exponent of [
    -1000,
    -325,
    325,
    1000,
    0.5,
    -0.5,
    NaN,
    Infinity,
    -Infinity,
  ]) {
    const expected = Decimal.pow(10, exponent)
    for (const input of [exponent, new Decimal(exponent)]) {
      expect(getPowerOf10(input)).toEqual(expected)
      expect(getPowerOf10(input)).not.toBe(getPowerOf10(input))
    }
  }
})
