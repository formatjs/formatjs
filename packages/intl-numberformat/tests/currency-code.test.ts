import {it, expect} from 'vitest'
import '@formatjs/intl-getcanonicallocales/polyfill.js'
import '@formatjs/intl-locale/polyfill.js'
import en from '#packages/intl-numberformat/tests/locale-data/en.json' with {type: 'json'}
import {NumberFormat} from '#packages/intl-numberformat/core'
NumberFormat.__addLocaleData(en as any)

it('normalizes lower-cased currency code', () => {
  const lowerCaseNf = new NumberFormat('en', {
    style: 'currency',
    currency: 'usd',
  })
  const upperCaseNf = new NumberFormat('en', {
    style: 'currency',
    currency: 'USD',
  })
  expect(lowerCaseNf.format(-1234)).toEqual(upperCaseNf.format(-1234))
})

it('rejects invalid currency code', () => {
  expect(() => {
    new NumberFormat('en', {style: 'currency', currency: '123'})
  }).toThrow(RangeError)
})
