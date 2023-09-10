import {ResolveLocale} from '../abstract/ResolveLocale'

test('ResolveLocale', function () {
  expect(
    ResolveLocale(
      new Set(['fr', 'en']),
      ['fr-XX', 'en'],
      {localeMatcher: 'best fit'},
      [],
      {},
      () => 'en'
    )
  ).toEqual({
    dataLocale: 'fr',
    locale: 'fr',
  })

  expect(
    ResolveLocale(
      new Set(['zh-Hant-TW', 'en']),
      ['zh-TW', 'en'],
      {localeMatcher: 'best fit'},
      [],
      {},
      () => 'en'
    )
  ).toEqual({
    dataLocale: 'zh-Hant-TW',
    locale: 'zh-Hant-TW',
  })

  expect(
    ResolveLocale(
      new Set(['th', 'en']),
      ['th-u-ca-gregory'],
      {localeMatcher: 'best fit'},
      ['ca', 'nu', 'hc'],
      {
        th: {
          nu: ['latn'],
          ca: ['buddhist', 'gregory'],
          hc: ['h23', 'h12'],
        },
      },
      () => 'en'
    )
  ).toEqual({
    dataLocale: 'th',
    locale: 'th-u-ca-gregory',
    nu: 'latn',
    ca: 'gregory',
    hc: 'h23',
  })
})

test('empty requested', function () {
  expect(
    ResolveLocale(
      new Set(['zh-Hant-TW', 'en']),
      [],
      {localeMatcher: 'best fit'},
      [],
      {},
      () => 'en'
    )
  ).toEqual({
    dataLocale: 'en',
    locale: 'en',
  })
})
