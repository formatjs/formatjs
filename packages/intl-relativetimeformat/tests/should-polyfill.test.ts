import {shouldPolyfill} from '#packages/intl-relativetimeformat/should-polyfill.js'
import '@formatjs/intl-getcanonicallocales/polyfill.js'
import '@formatjs/intl-locale/polyfill.js'
import '@formatjs/intl-pluralrules/polyfill.js'
import '@formatjs/intl-pluralrules/locale-data/en'
import en from '#packages/intl-relativetimeformat/tests/locale-data/en.json' with {type: 'json'}
import RelativeTimeFormat from '#packages/intl-relativetimeformat/index.js'
import {expect, it} from 'vitest'
RelativeTimeFormat.__addLocaleData(en)

it('falls back when the host cannot query supported locales', () => {
  const host = Object.getOwnPropertyDescriptor(Intl, 'RelativeTimeFormat')!
  const method = Object.getOwnPropertyDescriptor(
    RelativeTimeFormat,
    'supportedLocalesOf'
  )!
  try {
    Object.defineProperty(Intl, 'RelativeTimeFormat', {
      value: RelativeTimeFormat,
    })
    expect(shouldPolyfill('en')).toBeUndefined()
    Object.defineProperty(RelativeTimeFormat, 'supportedLocalesOf', {
      value: undefined,
    })
    expect(shouldPolyfill('en')).toBe('en')
  } finally {
    Object.defineProperty(RelativeTimeFormat, 'supportedLocalesOf', method)
    Object.defineProperty(Intl, 'RelativeTimeFormat', host)
  }
})
