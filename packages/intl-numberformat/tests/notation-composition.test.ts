import {describe, expect, it} from 'vitest'
import {NumberFormat} from '#packages/intl-numberformat/core'

for (const locale of ['en', 'de', 'tr', 'ar-SS']) {
  NumberFormat.__addLocaleData(require(`./locale-data/${locale}.json`))
}

describe('style and notation composition', () => {
  it.each([
    ['en', '1.2K%'],
    ['de', '1234\u00a0%'],
    ['tr', '%1,2\u00a0B'],
  ])('retains percent pattern in %s', (locale, expected) => {
    const formatter = new NumberFormat(locale, {
      style: 'percent',
      notation: 'compact',
    })
    expect(formatter.format(12.34)).toBe(expected)
    expect(
      formatter.formatToParts(12.34).filter(p => p.type === 'percentSign')
    ).toEqual([{type: 'percentSign', value: '%'}])
    expect(formatter.resolvedOptions().style).toBe('percent')
  })

  it.each([0, -0, 0.5, -12.34, NaN, Infinity, -Infinity])(
    'keeps percent affixes independent of notation for %s',
    value => {
      const affixes = (formatter: NumberFormat) =>
        formatter
          .formatToParts(value)
          .filter(p =>
            ['percentSign', 'plusSign', 'minusSign'].includes(p.type)
          )
      for (const locale of ['en', 'de', 'tr', 'ar-SS']) {
        for (const signDisplay of [
          'auto',
          'always',
          'never',
          'exceptZero',
          'negative',
        ] as const) {
          const standard = new NumberFormat(locale, {
            style: 'percent',
            signDisplay,
          })
          const compact = new NumberFormat(locale, {
            style: 'percent',
            notation: 'compact',
            signDisplay,
          })
          expect(affixes(compact)).toEqual(affixes(standard))
        }
      }
    }
  )

  it('keeps accounting outside long compact notation', () => {
    const formatter = new NumberFormat('en', {
      style: 'currency',
      currency: 'USD',
      currencySign: 'accounting',
      notation: 'compact',
      compactDisplay: 'long',
    })
    expect(formatter.format(-1234)).toBe('($1.2 thousand)')
  })

  it.each([
    ['9.994', '999%'],
    ['9.995', '1.0K%'],
    ['9999.5', '1.0M%'],
  ])('rounds %s after percent scaling', (value, expected) => {
    expect(
      new NumberFormat('en', {style: 'percent', notation: 'compact'}).format(
        value
      )
    ).toBe(expected)
  })

  it('keeps style around a numberless notation template', () => {
    const original = NumberFormat.localeData.en!
    const data = structuredClone(original)
    data.numbers.decimal.latn.short['1000'] = {other: 'mille'}
    try {
      NumberFormat.__addLocaleData({locale: 'en', data})
      expect(
        new NumberFormat('en', {style: 'percent', notation: 'compact'}).format(
          -10
        )
      ).toBe('-mille%')
    } finally {
      NumberFormat.__addLocaleData({locale: 'en', data: original})
    }
  })

  it.each([
    [undefined, '1,000,000,000T'],
    [false, '1000000000T'],
    ['always', '1,000,000,000T'],
  ] as const)('honors compact useGrouping=%s', (useGrouping, expected) => {
    expect(
      new NumberFormat('en', {notation: 'compact', useGrouping}).format(1e21)
    ).toBe(expected)
  })

  it('retains percent parts in ranges and approximate identity', () => {
    const formatter = new NumberFormat('en', {
      style: 'percent',
      notation: 'compact',
    })
    expect(formatter.formatRange(12, 13)).toBe('1.2K% – 1.3K%')
    expect(
      formatter.formatRangeToParts(12, 13).filter(p => p.type === 'percentSign')
    ).toEqual([
      {type: 'percentSign', value: '%', source: 'startRange'},
      {type: 'percentSign', value: '%', source: 'endRange'},
    ])
    expect(formatter.formatRange(12, 12)).toBe('~1.2K%')
  })

  it('keeps signed endpoints distinct when style affixes are shared', () => {
    const percent = new NumberFormat('de', {
      style: 'percent',
      notation: 'compact',
    })
    expect(percent.formatRange(-0.03, -0.02)).toBe('-3 – -2\u00a0%')
    expect(percent.formatRange(-0.03, 0.02)).toBe('-3–2\u00a0%')
    expect(
      percent
        .formatRangeToParts(-0.03, -0.02)
        .filter(p => p.type === 'minusSign')
        .map(p => p.source)
    ).toEqual(['startRange', 'endRange'])
    const accounting = new NumberFormat('en', {
      style: 'currency',
      currency: 'USD',
      currencySign: 'accounting',
      notation: 'compact',
    })
    expect(accounting.formatRange(-2000, -1000)).toBe('($2K) – ($1K)')
  })
})
