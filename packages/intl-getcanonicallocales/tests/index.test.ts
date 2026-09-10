import {getCanonicalLocales} from '#packages/intl-getcanonicallocales/index.js'
import {describe, expect, it} from 'vitest'
describe('Intl.getCanonicalLocales', () => {
  it('normalizes case before alias lookup', () => {
    expect(
      getCanonicalLocales([
        'DE-de',
        'de-DE',
        'CMN-hANS',
        'SGN-gr',
        'SL-ROZAJ-BISKE',
      ])
    ).toEqual(['de-DE', 'zh-Hans', 'gss', 'sl-biske-rozaj'])
  })
  it('accepts language-only and field-only transformed extensions', () => {
    expect(
      getCanonicalLocales([
        'en-t-EN-Latn-CA',
        'en-t-d0-ascii',
        'en-t-en-i0-handwrit',
      ])
    ).toEqual(['en-t-en-latn-ca', 'en-t-d0-ascii', 'en-t-en-i0-handwrit'])
    expect(() => getCanonicalLocales('en-t')).toThrow(RangeError)
    expect(() => getCanonicalLocales('en-t-d0')).toThrow(RangeError)
    expect(() => getCanonicalLocales('en-t-en-0')).toThrow(RangeError)
    expect(() => getCanonicalLocales('en-a')).toThrow(RangeError)
  })
  it('canonicalizes extension aliases while preserving transformed true', () => {
    expect(
      getCanonicalLocales([
        'en-t-m0-true',
        'und-Latn-t-und-hani-m0-names',
        'en-u-ca-islamicc',
        'en-u-ms-imperial',
        'en-u-kn-yes',
        'en-u-KN-TRUE-kn-false',
        'en-u-ks-primary',
      ])
    ).toEqual([
      'en-t-m0-true',
      'und-Latn-t-und-hani-m0-prprname',
      'en-u-ca-islamic-civil',
      'en-u-ms-uksystem',
      'en-u-kn',
      'en-u-ks-level1',
    ])
  })
  it('canonicalizes subdivision and region override aliases', () => {
    expect(
      getCanonicalLocales([
        'und-u-rg-no23',
        'und-NO-u-sd-no23',
        'und-u-rg-lud',
        'und-u-rg-fi01',
        'und-AX-u-sd-fi01',
        'en-u-rg-uszzzz',
      ])
    ).toEqual([
      'und-u-rg-no50',
      'und-NO-u-sd-no50',
      'und-u-rg-lucl',
      'und-u-rg-axzzzz',
      'und-AX-u-sd-axzzzz',
      'en-u-rg-uszzzz',
    ])
  })
  it('replaces matched alias subtags and keeps unrelated variants', () => {
    expect(
      getCanonicalLocales([
        'art-lojban',
        'jbo-lojban',
        'hy-arevela',
        'hy-arevmda',
        'hye-arevmda',
        'ja-Latn-fonipa-hepburn-heploc',
        'en-aaland',
        'en-GB-aaland',
      ])
    ).toEqual(['jbo', 'hy', 'hyw', 'ja-Latn-alalc97-fonipa', 'en-AX', 'en-GB'])
  })
  it('does not call an overridden Array.prototype.push', () => {
    const push = Array.prototype.push
    let actual: string[]
    try {
      Array.prototype.push = () => {
        throw new Error('observable push')
      }
      actual = getCanonicalLocales([
        'en-US',
        'SL-BISKE-ROZAJ',
        'en-u-attr-kn-yes',
        'en-t-en-m0-true',
        'en-a-foo-x-private',
      ])
    } finally {
      Array.prototype.push = push
    }
    expect(actual!).toEqual([
      'en-US',
      'sl-biske-rozaj',
      'en-u-attr-kn',
      'en-t-en-m0-true',
      'en-a-foo-x-private',
    ])
  })
  it('preserves legacy RegExp statics during canonicalization', () => {
    ;/sent(inel)/.exec('sentinel')
    const match = RegExp.lastMatch
    const group = RegExp.$1
    const actual = getCanonicalLocales([
      'en-u-co-phonebk',
      'JA-latn-hepburn-heploc',
      'en-t-en-m0-names',
      'en-A-FOO',
    ])
    const afterMatch = RegExp.lastMatch
    const afterGroup = RegExp.$1
    expect(actual).toEqual([
      'en-u-co-phonebk',
      'ja-Latn-alalc97',
      'en-t-en-m0-prprname',
      'en-a-foo',
    ])
    expect(afterMatch).toBe(match)
    expect(afterGroup).toBe(group)
    expect(() => getCanonicalLocales('en-a-foo-A-bar')).toThrow(RangeError)
    expect(() => getCanonicalLocales('en\n')).toThrow(RangeError)
  })
  it('regular', function () {
    expect(
      getCanonicalLocales('en-u-foo-bar-nu-thai-ca-buddhist-kk-true')
    ).toEqual(['en-u-bar-foo-ca-buddhist-kk-nu-thai'])
  })
  it('und-x-private', function () {
    expect(getCanonicalLocales('und-x-private')).toEqual(['und-x-private'])
  })
  it('should canonicalize casing for zh-hANs-sG', function () {
    expect(getCanonicalLocales('zh-hANs-sG')).toEqual(['zh-Hans-SG'])
  })
  it('should handle twi', function () {
    expect(getCanonicalLocales('twi')).toEqual(['ak'])
  })
  it('should handle ug-Arab-CN ', function () {
    expect(getCanonicalLocales('ug-Arab-CN')).toEqual(['ug-Arab-CN'])
  })
  it('canonicalizes twice', function () {
    expect(getCanonicalLocales('und-Armn-SU')).toEqual(['und-Armn-AM'])
  })

  describe('Intl.Locale object support', () => {
    it('should handle single Intl.Locale object', function () {
      const locale = new Intl.Locale('en-US')
      expect(getCanonicalLocales(locale)).toEqual(['en-US'])
    })

    it('should handle array of Intl.Locale objects', function () {
      const locales = [new Intl.Locale('en-US'), new Intl.Locale('fr-FR')]
      expect(getCanonicalLocales(locales)).toEqual(['en-US', 'fr-FR'])
    })

    it('should handle mixed array of strings and Intl.Locale objects', function () {
      const locales = [
        new Intl.Locale('en-US'),
        'fr-FR',
        new Intl.Locale('de-DE'),
      ]
      expect(getCanonicalLocales(locales)).toEqual(['en-US', 'fr-FR', 'de-DE'])
    })

    it('should canonicalize Intl.Locale objects with extensions', function () {
      const locale = new Intl.Locale('en-US-u-ca-buddhist')
      expect(getCanonicalLocales(locale)).toEqual(['en-US-u-ca-buddhist'])
    })

    it('should deduplicate Intl.Locale objects', function () {
      const locales = [
        new Intl.Locale('en-US'),
        'en-US',
        new Intl.Locale('en-US'),
      ]
      expect(getCanonicalLocales(locales)).toEqual(['en-US'])
    })

    it('should handle Intl.Locale with non-canonical input', function () {
      const locale = new Intl.Locale('zh-hANs-sG')
      expect(getCanonicalLocales(locale)).toEqual(['zh-Hans-SG'])
    })
  })

  describe('Array-like object support', () => {
    it('should handle array-like object with string locales', function () {
      const arrayLike = {0: 'en-US', 1: 'fr-FR', length: 2}
      expect(getCanonicalLocales(arrayLike)).toEqual(['en-US', 'fr-FR'])
    })

    it('should handle array-like object with Intl.Locale objects', function () {
      const arrayLike = {
        0: new Intl.Locale('en-US'),
        1: new Intl.Locale('fr-FR'),
        length: 2,
      }
      expect(getCanonicalLocales(arrayLike)).toEqual(['en-US', 'fr-FR'])
    })

    it('should handle array-like object with mixed types', function () {
      const arrayLike = {
        0: 'en-US',
        1: new Intl.Locale('fr-FR'),
        2: 'de-DE',
        length: 3,
      }
      expect(getCanonicalLocales(arrayLike)).toEqual([
        'en-US',
        'fr-FR',
        'de-DE',
      ])
    })

    it('should handle sparse array-like objects', function () {
      const arrayLike = {0: 'en-US', 2: 'de-DE', length: 3}
      expect(getCanonicalLocales(arrayLike)).toEqual(['en-US', 'de-DE'])
    })

    it('should handle array-like object with length 0', function () {
      const arrayLike = {0: 'en-US', length: 0}
      expect(getCanonicalLocales(arrayLike)).toEqual([])
    })

    it('should deduplicate in array-like objects', function () {
      const arrayLike = {0: 'en-US', 1: 'fr-FR', 2: 'en-US', length: 3}
      expect(getCanonicalLocales(arrayLike)).toEqual(['en-US', 'fr-FR'])
    })
  })

  describe('Error handling', () => {
    it('should throw TypeError for invalid locale type in array', function () {
      expect(() => getCanonicalLocales([123 as any])).toThrow(TypeError)
    })

    it('should throw RangeError after coercing an invalid object entry', function () {
      const arrayLike = {0: 'en-US', 1: {not: 'a locale'}, length: 2}
      expect(() => getCanonicalLocales(arrayLike as any)).toThrow(RangeError)
    })

    it('should throw RangeError for invalid locale string', function () {
      // Empty string is not a valid locale
      expect(() => getCanonicalLocales('')).toThrow(RangeError)
    })

    it('should throw RangeError for locale with underscore', function () {
      expect(() => getCanonicalLocales('de_DE')).toThrow(RangeError)
    })

    it('should throw RangeError for duplicate variants', function () {
      expect(() => getCanonicalLocales('de-gregory-gregory')).toThrow(
        RangeError
      )
    })
  })
})

it('applies ToObject and reads/coerces array-like length once', () => {
  expect(() => getCanonicalLocales(null as any)).toThrow(TypeError)
  let reads = 0
  expect(
    getCanonicalLocales({
      0: 'en',
      1: 'fr',
      get length() {
        reads++
        return '1.9'
      },
    } as any)
  ).toEqual(['en'])
  expect(reads).toBe(1)
  for (const length of [-1, NaN, undefined]) {
    expect(getCanonicalLocales({0: 'en', length} as any)).toEqual([])
  }
  for (const length of [1n, Symbol()]) {
    expect(() => getCanonicalLocales({length} as any)).toThrow(TypeError)
  }
})
it('coerces object and callable entries with the string hint', () => {
  const hints: string[] = []
  const value = {
    [Symbol.toPrimitive](hint: string) {
      hints.push(hint)
      return 'en'
    },
  }
  const callable = Object.assign(() => {}, {toString: () => 'fr'})
  expect(getCanonicalLocales([value, callable] as any)).toEqual(['en', 'fr'])
  expect(hints).toEqual(['string'])
  expect(() => getCanonicalLocales([null] as any)).toThrow(TypeError)
  expect(() => getCanonicalLocales([Symbol()] as any)).toThrow(TypeError)
})
it('reads Locale internal data without invoking overridden properties', () => {
  const locale = new Intl.Locale('en-US')
  Object.defineProperties(locale, {
    toString: {
      value() {
        throw new Error('must not call')
      },
    },
    baseName: {
      get() {
        throw new Error('must not read')
      },
    },
    language: {
      get() {
        throw new Error('must not read')
      },
    },
  })
  expect(getCanonicalLocales(locale)).toEqual(['en-US'])
  expect(getCanonicalLocales([locale])).toEqual(['en-US'])
})
it('does not identify Locale objects by their visible properties', () => {
  const reads: string[] = []
  const list = new Proxy(
    {0: 'en', length: 1},
    {
      get(target, key) {
        reads.push(String(key))
        return Reflect.get(target, key)
      },
    }
  )
  expect(getCanonicalLocales(list)).toEqual(['en'])
  expect(reads).toEqual(['length', '0'])
  const fake = {
    baseName: 'fr',
    language: 'fr',
    toString: () => 'fr',
    0: 'en',
    length: 1,
  }
  expect(getCanonicalLocales(fake)).toEqual(['en'])
})
