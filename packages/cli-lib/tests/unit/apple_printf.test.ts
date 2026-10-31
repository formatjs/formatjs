import {expect, test} from 'vitest'
import {verifyXcstringsWithNative} from '#packages/cli-lib/native.js'

function catalog(source: string, target: string) {
  return {
    'Localizable.xcstrings': {
      sourceLanguage: 'en',
      version: '1.0',
      strings: {
        message: {
          localizations: {
            en: {stringUnit: {value: source}},
            fr: {stringUnit: {value: target}},
          },
        },
      },
    },
  }
}

test('xcstrings native binding infers source and preserves Foundation argument types', () => {
  expect(
    verifyXcstringsWithNative(
      catalog('%@ %ld', '%2$li %1$@'),
      undefined,
      false,
      true
    )
  ).toEqual([])
  expect(
    verifyXcstringsWithNative(catalog('%@', '%s'), 'en', false, true)[0]
  ).toMatchObject({
    locale: 'fr',
    messageId: 'Localizable.xcstrings: message',
    error: expect.stringContaining('Incompatible argument 1'),
  })
})

test('xcstrings native boundary rejects flat JSON, source mismatch, unsupported syntax', () => {
  expect(() =>
    verifyXcstringsWithNative({'en.json': {message: '%@'}}, 'en', false, true)
  ).toThrow(/only .xcstrings/)
  expect(() =>
    verifyXcstringsWithNative(catalog('%@', '%@'), 'de', false, true)
  ).toThrow(/differs from sourceLanguage/)
  expect(
    verifyXcstringsWithNative(catalog('%@ %n', '%@'), undefined, false, true)[0]
      .error
  ).toContain('UnsupportedWriteCount')
})
