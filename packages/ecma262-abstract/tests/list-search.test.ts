import {expect, it} from 'vitest'
import {
  arrayIncludes,
  arrayIndexOf,
} from '#packages/ecma262-abstract/intrinsics.js'

it('preserves list equality, first-match indices and sparse-slot semantics', () => {
  const values = [NaN, -0, undefined, -0]
  expect(arrayIncludes(values, NaN)).toBe(true)
  expect(arrayIndexOf(values, NaN)).toBe(-1)
  expect(arrayIncludes(values, 0)).toBe(true)
  expect(arrayIndexOf(values, 0)).toBe(1)
  expect(arrayIncludes(values, 'missing')).toBe(false)
  expect(arrayIndexOf(values, 'missing')).toBe(-1)
  const sparse = new Array<unknown>(2)
  sparse[1] = undefined
  expect(arrayIncludes(sparse, undefined)).toBe(true)
  expect(arrayIndexOf(sparse, undefined)).toBe(1)
})
