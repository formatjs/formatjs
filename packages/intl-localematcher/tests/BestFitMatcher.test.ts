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

test('BestFitMatcher en', function () {
  expect(BestFitMatcher(new Set(['en', 'und']), ['en'], () => 'en')).toEqual({
    locale: 'en',
  })
})
