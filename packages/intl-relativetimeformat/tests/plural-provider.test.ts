import type {PluralRules} from '@formatjs/intl-pluralrules'
import RelativeTimeFormat from '#packages/intl-relativetimeformat/index.js'
import en from '#packages/intl-relativetimeformat/tests/locale-data/en.json' with {type: 'json'}
import {expect, test} from 'vitest'

test('uses a PluralRules polyfill installed after RelativeTimeFormat loads', async () => {
  RelativeTimeFormat.__addLocaleData(en)
  expect(new RelativeTimeFormat('en').format(1, 'day')).toBe('in 1 day')

  await import('@formatjs/intl-pluralrules/polyfill-force.js')
  const installed = Intl.PluralRules as unknown as typeof PluralRules
  installed.__addLocaleData({
    locale: 'en',
    data: {
      categories: {cardinal: ['other'], ordinal: ['other']},
      fn: () => 'other',
    },
  })
  expect(new RelativeTimeFormat('en').format(1, 'day')).toBe('in 1 days')
})
