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
