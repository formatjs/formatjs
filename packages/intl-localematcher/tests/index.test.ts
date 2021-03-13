import {match} from '../'

test('Intl.LocaleMatcher', function () {
  expect(match(['fr-XX', 'en'], ['fr', 'en'], 'en')).toEqual('fr')
  expect(match(['zh-TW', 'en'], ['zh-Hant-TW', 'en'], 'en')).toEqual(
    'zh-Hant-TW'
  )
})

test('empty requested', function () {
  expect(match([], ['zh-Hant-TW', 'en'], 'en')).toEqual('en')
})

test('extension', function () {
  expect(match(['fr-CA-x-foo'], ['zh-Hant-TW', 'fr', 'en'], 'en')).toEqual('fr')
})
