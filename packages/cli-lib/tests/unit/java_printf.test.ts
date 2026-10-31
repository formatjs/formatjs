import {describe, expect, it} from 'vitest'
import {verifyJavaPrintfWithNative} from '#packages/cli-lib/native.js'

describe('Java printf native verification', () => {
  it('round-trips catalogs and structured diagnostics through the Rust binding', () => {
    expect(
      verifyJavaPrintfWithNative(
        {
          en: {message: '%s %d'},
          fr: {message: '%2$d %1$s %<s'},
        },
        'en'
      )
    ).toEqual([])
    expect(
      verifyJavaPrintfWithNative(
        {
          en: {screen: {title: '%s %d'}},
          fr: {screen: {title: '%1$d'}},
        },
        'en'
      )
    ).toEqual([
      {
        locale: 'fr',
        messageId: 'screen.title',
        error:
          'Incompatible argument 1: {String} vs {Integer}; Missing argument 2',
      },
    ])
  })

  it('reports source syntax and malformed catalog locations without exiting Node', () => {
    expect(
      verifyJavaPrintfWithNative({en: {invalid: '%q'}, fr: {}}, 'en')
    ).toEqual([
      {
        locale: 'en',
        messageId: 'invalid',
        error:
          "Invalid Java printf syntax: UnknownConversion('q') at bytes 0..2",
      },
    ])
    expect(() =>
      verifyJavaPrintfWithNative({en: {list: ['%s']}}, 'en')
    ).toThrow(/locale en.*string at list/)
    expect(() => verifyJavaPrintfWithNative({fr: {}}, 'en')).toThrow(
      /Missing source en.json/
    )
  })
})
