import {DateTimeFormat} from '#packages/intl-datetimeformat/core.js'
import en from '#packages/intl-datetimeformat/tests/locale-data/en.json' with {type: 'json'}
import enGB from '#packages/intl-datetimeformat/tests/locale-data/en-GB.json' with {type: 'json'}
import enNumber from '#packages/intl-numberformat/tests/locale-data/en.json' with {type: 'json'}
import type {NumberFormat} from '@formatjs/intl-numberformat'
import type {RawNumberLocaleData} from '#packages/ecma402-abstract/types/number.js'
import {expect, test} from 'vitest'

// @ts-ignore
DateTimeFormat.__addLocaleData(en, enGB)

test('recognizes Locale objects installed after DateTimeFormat loads', async () => {
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

test('uses a NumberFormat polyfill installed after DateTimeFormat loads', async () => {
  await import('@formatjs/intl-numberformat/polyfill-force.js')
  const installed = Intl.NumberFormat as unknown as typeof NumberFormat
  const data = structuredClone(enNumber) as unknown as RawNumberLocaleData
  data.data.numbers.symbols.latn.decimal = '~'
  installed.__addLocaleData(data)
  const formatter = new DateTimeFormat('en', {
    timeZone: 'UTC',
    second: 'numeric',
    fractionalSecondDigits: 3,
  })
  expect(formatter.formatToParts(789)).toContainEqual({
    type: 'literal',
    value: '~',
  })
})
