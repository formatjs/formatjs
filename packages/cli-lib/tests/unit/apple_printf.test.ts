import {expect, test} from 'vitest'
import {verifyAppleResourcesWithNative} from '#packages/cli-lib/native.js'

function verifyCatalogs(
  catalogs: Record<string, unknown>,
  sourceLocale: string | undefined,
  missingKeys: boolean,
  structuralEquality: boolean
) {
  return verifyAppleResourcesWithNative(
    Object.entries(catalogs).map(([filename, content]) => ({
      filename,
      content: Buffer.from(JSON.stringify(content)),
    })),
    sourceLocale,
    missingKeys,
    false,
    structuralEquality
  )
}

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
    verifyCatalogs(catalog('%@ %ld', '%2$li %1$@'), undefined, false, true)
  ).toEqual([])
  expect(
    verifyCatalogs(catalog('%@', '%s'), 'en', false, true)[0]
  ).toMatchObject({
    locale: 'fr',
    messageId: 'Localizable.xcstrings: message',
    error: expect.stringContaining('Incompatible argument 1'),
  })
})

test('xcstrings native boundary rejects flat JSON, source mismatch, unsupported syntax', () => {
  expect(() =>
    verifyCatalogs({'en.json': {message: '%@'}}, 'en', false, true)
  ).toThrow(/only .xcstrings/)
  expect(() => verifyCatalogs(catalog('%@', '%@'), 'de', false, true)).toThrow(
    /differs from sourceLanguage/
  )
  expect(
    verifyCatalogs(catalog('%@ %n', '%@'), undefined, false, true)[0].error
  ).toContain('UnsupportedWriteCount')
})

test('native resource binding preserves UTF-16 bytes and reports argument mismatches', () => {
  const source = {
    filename: 'en.lproj/InfoPlist.strings',
    content: Buffer.from('"purpose"="Hello %@";'),
  }
  const target = {
    filename: 'fr.lproj/InfoPlist.strings',
    content: Buffer.from('\uFEFF"purpose"="Bonjour %1$@";', 'utf16le'),
  }
  expect(
    verifyAppleResourcesWithNative([source, target], 'en', true, true, true)
  ).toEqual([])
  target.content = Buffer.from('"purpose"="Wrong %s";')
  expect(
    verifyAppleResourcesWithNative([source, target], 'en', true, true, true)[0]
  ).toMatchObject({
    locale: 'fr',
    messageId: 'InfoPlist: purpose',
    error: expect.stringContaining('Incompatible argument 1'),
  })
})
