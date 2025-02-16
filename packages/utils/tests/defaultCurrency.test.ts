import {defaultCurrency} from '../src/defaultCurrency'
import {expect, describe, it} from 'vitest'
describe('defaultCurrency', () => {
  it('should return the default currency when no currency is provided', () => {
    const result = defaultCurrency()
    expect(result).toBe('USD')
  })

  it('should return the provided currency when a valid currency is provided', () => {
    const result = defaultCurrency('DE')
    expect(result).toBe('EUR')
  })

  it('should return the default currency when an invalid currency is provided', () => {
    const result = defaultCurrency('XY')
    expect(result).toBe('USD')
  })
})
