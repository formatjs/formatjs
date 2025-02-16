import {defaultLocale} from '../src/defaultLocale'
import {expect, describe, it} from 'vitest'
describe('defaultCurrency', () => {
  it('should return the default locale when no country code is provided', () => {
    expect(defaultLocale()).toBe('en')
  })

  it('should return the provided locale when a valid country code is provided', () => {
    expect(defaultLocale('DE')).toBe('de-Latn-DE')
    expect(defaultLocale('JP')).toBe('ja-Jpan-JP')
  })

  it('should return the default locale when an invalid country code is provided', () => {
    expect(defaultLocale('XY')).toBe('en')
  })
})
