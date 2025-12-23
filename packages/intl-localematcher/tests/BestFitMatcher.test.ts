import {BestFitMatcher} from '../abstract/BestFitMatcher.js'
import {expect, test} from 'vitest'
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

test('GH #4272', function () {
  expect(BestFitMatcher(['fr', 'en'], ['es'], () => 'en')).toEqual({
    locale: 'en',
  })

  expect(BestFitMatcher(['en', 'fr', 'en'], ['es'], () => 'fr')).toEqual({
    locale: 'fr',
  })
})

test('GH #4258', function () {
  expect(
    BestFitMatcher(['en', 'en-US', 'fr-FR'], ['de-DE', 'fr'], () => 'en-US')
  ).toEqual({
    locale: 'fr-FR',
  })
})

test('GH #4237', function () {
  expect(
    BestFitMatcher(
      ['en-US', 'nl-NL', 'nl'],
      ['en-GB', 'en-US', 'en'],
      () => 'en-US'
    )
  ).toEqual({
    locale: 'en-US',
  })
})

test('bestFitMatcher testing $cnsar: zh-HK', function () {
  // With Tier 2 optimization, zh-HK maximizes to zh-Hant-HK → falls back to zh-Hant
  // Previously used CLDR $cnsar data to match zh-MO, but maximization is linguistically correct
  expect(BestFitMatcher(['zh-Hant', 'zh-MO'], ['zh-HK'], () => 'en')).toEqual({
    locale: 'zh-Hant',
  })
})

test('bestFitMatcher testing $enUS: en-CA', function () {
  expect(BestFitMatcher(['en-GB', 'en-US'], ['en-CA'], () => 'en-US')).toEqual({
    locale: 'en-US',
  })
})

test('bestFitMatcher testing $americas: es-KY', function () {
  // With Tier 2 fallback optimization, es-KY → es (simple fallback)
  // Previously used CLDR $americas data to match es-419
  expect(BestFitMatcher(['es', 'en', 'es-419'], ['es-KY'], () => 'en')).toEqual(
    {
      locale: 'es',
    }
  )
})
