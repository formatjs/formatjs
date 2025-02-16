import {LookupMatcher} from '../abstract/LookupMatcher'
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
