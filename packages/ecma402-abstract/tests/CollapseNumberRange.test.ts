import {CollapseNumberRange} from '../NumberFormat/CollapseNumberRange'

describe('CollapseNumberRange', () => {
  test('returns the same result', () => {
    expect(CollapseNumberRange(1)).toBe(1)
  })
})
