import {DateTimeFormat} from '#packages/intl-datetimeformat/core.js'
import en from '#packages/intl-datetimeformat/tests/locale-data/en.json' with {type: 'json'}
import enGB from '#packages/intl-datetimeformat/tests/locale-data/en-GB.json' with {type: 'json'}
import {expect, test} from 'vitest'

test('recognizes Locale objects installed after DateTimeFormat loads', async () => {
  // @ts-ignore
  DateTimeFormat.__addLocaleData(en, enGB)
  expect(DateTimeFormat.supportedLocalesOf('en-GB')).toEqual(['en-GB'])

  await import('@formatjs/intl-locale/polyfill-force.js')
  const locale = new Intl.Locale('en-GB') as unknown as string
  const canonicalize = Intl.getCanonicalLocales
  try {
    Intl.getCanonicalLocales = () => {
      throw new Error('Called replacement Intl.getCanonicalLocales')
    }
    expect(DateTimeFormat.supportedLocalesOf(locale)).toEqual(['en-GB'])
    expect(
      new DateTimeFormat(locale, {timeZone: 'UTC'}).resolvedOptions().locale
    ).toBe('en-GB')
  } finally {
    Intl.getCanonicalLocales = canonicalize
  }
})
