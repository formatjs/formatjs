import {describe, expect, it} from 'vitest'
import {IsUnicodeLocaleIdentifierType} from '#packages/ecma402-abstract/IsUnicodeLocaleIdentifierType.js'

describe('IsUnicodeLocaleIdentifierType', () => {
  it.each([
    'abc',
    'abcdefgh',
    'abc-12345678',
    'GREGORY',
    'foobar',
    'islamic-civil',
  ])('accepts well-formed types regardless of locale support: %s', value => {
    expect(IsUnicodeLocaleIdentifierType(value)).toBe(true)
  })
  it.each([
    '',
    'ab',
    'abcdefghi',
    '-abc',
    'abc-',
    'abc--def',
    'abc_de f',
    'abc_def',
    'abc-de',
    'abc-defghijkl',
    'ébc',
    'abc\n',
  ])('rejects malformed types: %s', value => {
    expect(IsUnicodeLocaleIdentifierType(value)).toBe(false)
  })
})
