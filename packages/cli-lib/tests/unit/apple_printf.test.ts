import {expect, test} from 'vitest'
import {verifyApplePrintfWithNative} from '#packages/cli-lib/native.js'

test('Apple printf native binding preserves Foundation argument types', () => {
  expect(
    verifyApplePrintfWithNative(
      {en: {message: '%@ %ld'}, fr: {message: '%2$li %1$@'}},
      'en'
    )
  ).toEqual([])
  expect(
    verifyApplePrintfWithNative(
      {en: {message: '%@'}, fr: {message: '%s'}},
      'en'
    )
  ).toEqual([
    {
      locale: 'fr',
      messageId: 'message',
      error: 'Incompatible argument 1: {Object} vs {String}',
    },
  ])
})

test('Apple printf source syntax and malformed catalog errors cross native boundary', () => {
  expect(
    verifyApplePrintfWithNative({en: {bad: '%n'}}, 'en')[0].error
  ).toContain('UnsupportedWriteCount')
  expect(() => verifyApplePrintfWithNative({en: {bad: ['%@']}}, 'en')).toThrow(
    /Expected a Apple printf string/
  )
})
