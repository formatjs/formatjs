import {countryCodeAlpha3ToAlpha2} from '../src/countryCodes'

test('countryCodeAlpha3ToAlpha2', () => {
  expect(countryCodeAlpha3ToAlpha2('USA')).toBe('US')
  expect(countryCodeAlpha3ToAlpha2('US')).toBe('US')
  expect(countryCodeAlpha3ToAlpha2('usa')).toBe('US')
  expect(countryCodeAlpha3ToAlpha2('us')).toBe('US')
  expect(countryCodeAlpha3ToAlpha2('')).toBe(undefined)
  expect(countryCodeAlpha3ToAlpha2()).toBe(undefined)
  expect(countryCodeAlpha3ToAlpha2('ZZ')).toBe(undefined)
  expect(countryCodeAlpha3ToAlpha2('zz')).toBe(undefined)
})
