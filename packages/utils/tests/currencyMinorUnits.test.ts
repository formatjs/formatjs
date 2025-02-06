import {currencyMinorUnits} from '../src/currencyMinorUnits'

describe('currencyMinorUnits', () => {
  it('should return the correct minor units for known currency codes', () => {
    expect(currencyMinorUnits('USD')).toBe(2)
    expect(currencyMinorUnits('EUR')).toBe(2)
    expect(currencyMinorUnits('JPY')).toBe(0)
  })

  it('should throw an error for unknown currency codes', () => {
    expect(() => currencyMinorUnits('UNKNOWN')).toThrow(
      'Unknown currency code: UNKNOWN'
    )
  })

  it('should handle lowercase currency codes', () => {
    expect(currencyMinorUnits('usd')).toBe(2)
    expect(currencyMinorUnits('eur')).toBe(2)
    expect(currencyMinorUnits('jpy')).toBe(0)
  })
})
