import {shouldPolyfill} from '#packages/intl-listformat/should-polyfill.js'
import '@formatjs/intl-getcanonicallocales/polyfill.js'
import '@formatjs/intl-locale/polyfill.js'
import ListFormat from '#packages/intl-listformat/index.js'
import en from '#packages/intl-listformat/tests/locale-data/en.json' with {type: 'json'}
import {expect, it} from 'vitest'
ListFormat.__addLocaleData(en)

it.each([
  ['unavailable', undefined],
  [
    'throwing',
    () => {
      throw new RangeError('Host locale support unavailable')
    },
  ],
] as const)('falls back when the native locale query is %s', (_kind, probe) => {
  const host = Object.getOwnPropertyDescriptor(Intl, 'ListFormat')!
  const method = Object.getOwnPropertyDescriptor(
    ListFormat,
    'supportedLocalesOf'
  )!
  try {
    Object.defineProperty(Intl, 'ListFormat', {value: ListFormat})
    expect(shouldPolyfill('en')).toBeUndefined()
    Object.defineProperty(ListFormat, 'supportedLocalesOf', {value: probe})
    expect(shouldPolyfill('en')).toBe('en')
  } finally {
    Object.defineProperty(ListFormat, 'supportedLocalesOf', method)
    Object.defineProperty(Intl, 'ListFormat', host)
  }
})
