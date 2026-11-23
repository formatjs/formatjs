import {expect, test} from 'vitest'
import {ToIntlMathematicalValue} from '#packages/ecma402-abstract/ToIntlMathematicalValue.js'

test.each([
  ['001.00', '1', 3, 2],
  ['.00100', '0.001', 3, 5],
  ['1.20e1', '12', 3, 1],
  ['1.20e-1', '0.12', 3, 3],
  ['0.00e1', '0', 3, 1],
  ['-0.00e-1', '-0', 3, 3],
  ['1e-400', '0', 1, 400],
  ['1.00e400', 'Infinity', 0, 0],
  ['0x001', '1', 0, 0],
  ['', '0', 0, 0],
  ['oops', 'NaN', 0, 0],
  [1, '1', 0, 0],
  [1n, '1', 0, 0],
  [null, '0', 0, 0],
] as const)('Intl MV %s', (input, expected, digits, fraction) => {
  const result = ToIntlMathematicalValue(input)
  const value =
    result.value.isZero() && result.value.isNegative()
      ? '-0'
      : result.value.toString()
  expect({
    value,
    digits: result.stringDigitCount,
    fraction: result.stringFractionDigitCount,
  }).toEqual({value: expected, digits, fraction})
})
