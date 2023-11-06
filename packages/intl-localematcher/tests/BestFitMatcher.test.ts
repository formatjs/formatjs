import {BestFitMatcher} from '../abstract/BestFitMatcher'

test('BestFitMatcher', function () {
  expect(BestFitMatcher(['fr', 'en'], ['fr-XX', 'en'], () => 'en')).toEqual({
    locale: 'fr',
  })
})

test('BestFitMatcher zh-TW', function () {
  expect(BestFitMatcher(['zh', 'zh-Hant'], ['zh-TW'], () => 'en')).toEqual({
    locale: 'zh-Hant',
  })
})

test('BestFitMatcher en', function () {
  expect(BestFitMatcher(['en', 'und'], ['en'], () => 'en')).toEqual({
    locale: 'en',
  })
})

test('BestFitMatcher extension', function () {
  expect(BestFitMatcher(['th'], ['th-u-ca-gregory'], () => 'en')).toEqual({
    locale: 'th',
    extension: '-u-ca-gregory',
  })
})
