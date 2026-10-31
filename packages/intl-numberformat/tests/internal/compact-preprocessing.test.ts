import {expect, it} from 'vitest'
import {NumberFormat} from '#packages/intl-numberformat/index.js'
import en from '#packages/intl-numberformat/tests/locale-data/en.json' with {type: 'json'}
import type {RawNumberLocaleData} from '#packages/ecma402-abstract/types/number.js'
NumberFormat.__addLocaleData(en as unknown as RawNumberLocaleData)

it('keeps compact matching independent of threshold insertion order', () => {
  const original = NumberFormat.localeData.en!
  const data = JSON.parse(JSON.stringify(original)) as typeof original
  const expected = new NumberFormat('en', {notation: 'compact'}).format('1e21')
  for (const style of ['short', 'long'] as const)
    data.numbers.decimal.latn[style] = Object.fromEntries(
      Object.entries(data.numbers.decimal.latn[style]).reverse()
    ) as typeof data.numbers.decimal.latn.short
  const snapshot = JSON.stringify(data)
  try {
    NumberFormat.__addLocaleData({locale: 'en', data})
    expect(new NumberFormat('en', {notation: 'compact'}).format('1e21')).toBe(
      expected
    )
    expect(JSON.stringify(data)).toBe(snapshot)
  } finally {
    NumberFormat.__addLocaleData({locale: 'en', data: original})
  }
})

it('refreshes compiled compact exponents when the same payload is registered again', () => {
  const original = NumberFormat.localeData.en!
  const data = JSON.parse(JSON.stringify(original)) as typeof original
  try {
    NumberFormat.__addLocaleData({locale: 'en', data})
    expect(new NumberFormat('en', {notation: 'compact'}).format(1e6)).toBe('1M')
    data.numbers.decimal.latn.short['1000000'].other = '00Q'
    NumberFormat.__addLocaleData({locale: 'en', data})
    expect(new NumberFormat('en', {notation: 'compact'}).format(1e6)).toBe(
      '10Q'
    )
  } finally {
    NumberFormat.__addLocaleData({locale: 'en', data: original})
  }
})

it('refreshes best-fit matching after another locale is registered', () => {
  const locale = 'en-XX'
  const original = NumberFormat.localeData[locale]
  const supported = NumberFormat.availableLocales.has(locale)
  try {
    expect(new NumberFormat(locale).resolvedOptions().locale).not.toBe(locale)
    expect(new NumberFormat(locale).resolvedOptions().locale).not.toBe(locale)
    NumberFormat.__addLocaleData({locale, data: NumberFormat.localeData.en!})
    expect(new NumberFormat(locale).resolvedOptions().locale).toBe(locale)
  } finally {
    if (original) NumberFormat.__addLocaleData({locale, data: original})
    else delete NumberFormat.localeData[locale]
    if (!supported) NumberFormat.availableLocales.delete(locale)
  }
})
