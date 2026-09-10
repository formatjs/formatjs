import {LookupMatcher} from '#packages/intl-localematcher/abstract/LookupMatcher.js'
import {expect, test} from 'vitest'
test('LookupMatcher', function () {
  expect(LookupMatcher(['fr', 'en'], ['fr-XX', 'en'], () => 'en')).toEqual({
    locale: 'fr',
  })
})

test('LookupMatcher', function () {
  expect(LookupMatcher(['zh', 'zh-Hant'], ['zh-Hans'], () => 'en')).toEqual({
    locale: 'zh',
  })
})

test('LookupMatcher', function () {
  expect(LookupMatcher(['th'], ['th-u-ca-gregory'], () => 'en')).toEqual({
    locale: 'th',
    extension: '-u-ca-gregory',
  })
})

test('respects Unicode extension boundaries', () => {
  for (const [tag, extension] of [
    ['de-x-u-co-phonebk', undefined],
    ['de-u-co-phonebk-x-private', '-u-co-phonebk'],
    ['de-t-en-u-co-phonebk-x-u-kn', '-u-co-phonebk'],
  ]) {
    expect(LookupMatcher(['de'], [tag!], () => 'en')).toEqual({
      locale: 'de',
      ...(extension ? {extension} : {}),
    })
  }
})
