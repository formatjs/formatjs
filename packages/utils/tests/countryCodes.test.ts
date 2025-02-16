import {canonicalizeCountryCode} from '../src/countryCodes'
import {expect, test} from 'vitest'
test('canonicalizeCountryCode', () => {
  expect(canonicalizeCountryCode('USA')).toBe('US')
  expect(canonicalizeCountryCode('US')).toBe('US')
  expect(canonicalizeCountryCode('usa')).toBe('US')
  expect(canonicalizeCountryCode('us')).toBe('US')
  expect(canonicalizeCountryCode('')).toBe(undefined)
  expect(canonicalizeCountryCode()).toBe(undefined)
  expect(canonicalizeCountryCode('ZZ')).toBe(undefined)
  expect(canonicalizeCountryCode('zz')).toBe(undefined)
})
