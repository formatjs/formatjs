import {currencyMinorScale} from '../src/iso4217'

describe('currencyMinorScale', () => {
  it('should return 100 for USD', () => {
    expect(currencyMinorScale('USD')).toBe(100)
  })

  it('should return 100 for EUR', () => {
    expect(currencyMinorScale('EUR')).toBe(100)
  })

  it('should return 1 for JPY', () => {
    expect(currencyMinorScale('JPY')).toBe(1)
  })

  it('should throw an error for unknown currency code', () => {
    expect(() => currencyMinorScale('UNKNOWN')).toThrow(
      'Unknown currency code: UNKNOWN'
    )
  })
})
