import {LookupMatcher} from '../abstract/LookupMatcher'

test('LookupMatcher', function () {
  expect(
    LookupMatcher(new Set(['fr', 'en']), ['fr-XX', 'en'], () => 'en')
  ).toEqual({
    locale: 'fr',
  })
})

test('LookupMatcher', function () {
  expect(
    LookupMatcher(new Set(['zh', 'zh-Hant']), ['zh-Hans'], () => 'en')
  ).toEqual({
    locale: 'zh',
  })
})

test('LookupMatcher', function () {
  expect(
    LookupMatcher(new Set(['th']), ['th-u-ca-gregory'], () => 'en')
  ).toEqual({
    locale: 'th',
    extension: '-u-ca-gregory',
  })
})
