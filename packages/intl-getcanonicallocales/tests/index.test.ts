import {getCanonicalLocales} from '#packages/intl-getcanonicallocales/index.js'
import {describe, expect, it} from 'vitest'
describe('Intl.getCanonicalLocales', () => {
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
