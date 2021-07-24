import {BestFitMatcher} from '../abstract/BestFitMatcher'

test('BestFitMatcher', function () {
  expect(
    BestFitMatcher(new Set(['fr', 'en']), ['fr-XX', 'en'], () => 'en')
  ).toEqual({
    locale: 'fr',
  })
})

test('BestFitMatcher zh-TW', function () {
  expect(
    BestFitMatcher(new Set(['zh', 'zh-Hant']), ['zh-TW'], () => 'en')
  ).toEqual({
    locale: 'zh-Hant',
  })
})
