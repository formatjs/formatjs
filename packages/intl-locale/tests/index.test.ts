import '@formatjs/intl-getcanonicallocales/polyfill.js'
import {Locale} from '../'
import {describe, expect, it, test} from 'vitest'
describe('intl-locale', () => {
  it('toString', function () {
    // expect(() => IntlLocale.prototype.toString.call(IntlLocale.prototype)).toThrowError(TypeError)
    expect(
      new Locale('en-u-foo-bar-nu-thai-ca-buddhist-kk-true').toString()
    ).toBe('en-u-bar-foo-ca-buddhist-kk-nu-thai')
  })
  it('invalid tag', function () {
    // expect(() => IntlLocale.prototype.toString.call(IntlLocale.prototype)).toThrowError(TypeError)
    expect(() => new Locale({} as any)).toThrowError(RangeError)
  })
  it('und-x-private', function () {
    expect(new Locale('und-x-private').toString()).toBe('und-x-private')
  })

  describe('new locale info proposal properties', () => {
    it('ar', () => {
      const locale = new Locale('ar')
      expect(locale.getCalendars()).toEqual([
        'gregory',
        'coptic',
        'islamic',
        'islamicc',
        'islamic-tbla',
      ])
      // Runtime-dependent: 'compat' collation may not be supported on all platforms
      const collations = locale.getCollations()
      expect(collations).toContain('emoji')
      expect(collations).toContain('eor')
      expect(locale.getHourCycles()).toEqual(['h12', 'h23'])
      expect(locale.getNumberingSystems()).toEqual(['latn', 'arab'])
      expect(locale.getTimeZones()).toBe(undefined)
    })

    it('ar-EG', () => {
      const locale = new Locale('ar-EG')
      expect(locale.getCalendars()).toEqual([
        'gregory',
        'coptic',
        'islamic',
        'islamicc',
        'islamic-tbla',
      ])
      // Runtime-dependent: 'compat' collation may not be supported on all platforms
      const collations = locale.getCollations()
      expect(collations).toContain('emoji')
      expect(collations).toContain('eor')
      expect(locale.getHourCycles()).toEqual(['h12', 'h23'])
      expect(locale.getNumberingSystems()).toEqual(['arab'])
      expect(JSON.stringify(locale.getTimeZones())).toMatch(
        JSON.stringify(['Africa/Cairo'])
      )
    })

    it('ar-SA', () => {
      const locale = new Locale('ar-SA')
      expect(locale.getCalendars()).toEqual([
        'gregory',
        'islamic-umalqura',
        'islamic',
        'islamic-rgsa',
      ])
      // Runtime-dependent: 'compat' collation may not be supported on all platforms
      const collations = locale.getCollations()
      expect(collations).toContain('emoji')
      expect(collations).toContain('eor')
      expect(locale.getHourCycles()).toEqual(['h12', 'h23'])
      expect(locale.getNumberingSystems()).toEqual(['arab'])
      expect(JSON.stringify(locale.getTimeZones())).toMatch(
        JSON.stringify(['Asia/Riyadh'])
      )
    })

    it('ja', () => {
      const locale = new Locale('ja')
      expect(locale.getCalendars()).toEqual(['gregory', 'japanese'])
      // Runtime-dependent: 'unihan' collation may not be supported on all platforms
      const collations = locale.getCollations()
      expect(collations).toContain('emoji')
      expect(collations).toContain('eor')
      expect(locale.getHourCycles()).toEqual(['h23', 'h11', 'h12'])
      expect(locale.getNumberingSystems()).toEqual(['latn', 'jpan', 'jpanfin'])
      expect(locale.getTimeZones()).toBe(undefined)
    })

    it('pt-BR', () => {
      const locale = new Locale('pt-BR')
      expect(locale.getCalendars()).toEqual(['gregory'])
      expect(locale.getCollations()).toEqual(['emoji', 'eor'])
      expect(locale.getHourCycles()).toEqual(['h23'])
      expect(locale.getNumberingSystems()).toEqual(['latn'])
      expect(JSON.stringify(locale.getTimeZones())).toMatch(
        JSON.stringify([
          'America/Araguaina',
          'America/Bahia',
          'America/Belem',
          'America/Boa_Vista',
          'America/Campo_Grande',
          'America/Cuiaba',
          'America/Eirunepe',
          'America/Fortaleza',
          'America/Maceio',
          'America/Manaus',
          'America/Noronha',
          'America/Porto_Velho',
          'America/Recife',
          'America/Rio_Branco',
          'America/Santarem',
          'America/Sao_Paulo',
        ])
      )
    })
  })

  it('has static polyfilled property', function () {
    expect(Locale.polyfilled).toBe(true)
  })

  describe('variants property', () => {
    it('should return undefined for locale without variants', function () {
      expect(new Locale('en-US').variants).toBe(undefined)
    })

    it('should return variant string for locale with single variant', function () {
      expect(new Locale('ca-valencia').variants).toBe('valencia')
    })

    it('should return hyphen-joined variants for locale with multiple variants', function () {
      // Note: variants are sorted alphabetically during canonicalization
      const locale = new Locale('de-DE-1996-1901')
      expect(locale.variants).toBe('1901-1996')
    })

    it('should return undefined for locale with only language', function () {
      expect(new Locale('en').variants).toBe(undefined)
    })

    it('should return variant for locale with script', function () {
      expect(new Locale('en-Latn-fonipa').variants).toBe('fonipa')
    })

    it('should handle fonipa variant', function () {
      expect(new Locale('en-fonipa').variants).toBe('fonipa')
    })

    it('should preserve multiple variants in correct order after canonicalization', function () {
      const locale = new Locale('de-DE-1901-1996')
      expect(locale.variants).toBe('1901-1996')
    })

    it('should return variant for locale with extensions', function () {
      const locale = new Locale('ca-valencia-u-ca-gregory')
      expect(locale.variants).toBe('valencia')
    })

    it('should handle numeric variant 1606nict', function () {
      const locale = new Locale('fr-1606nict')
      expect(locale.variants).toBe('1606nict')
    })
  })
})

test('getWeekInfo', function () {
  expect(new Locale('en-uS').getWeekInfo()).toEqual({
    firstDay: 7,
    weekend: [6, 7],
    minimalDays: 1,
  })
})

test('GH #4575', function () {
  expect(new Locale('ar-sa').getTextInfo()).toEqual({
    direction: 'rtl',
  })
  expect(new Locale('ar-sa').maximize().getTextInfo()).toEqual({
    direction: 'rtl',
  })
})

test('GH #5112 - getWeekInfo should be available for week calculations', function () {
  // Issue #5112: Firefox has incomplete Intl.Locale implementation
  // missing getWeekInfo() which breaks Luxon's localWeekNumber calculation
  // This test ensures the polyfill provides getWeekInfo() for all locales

  const locale = new Locale('en-US')

  // getWeekInfo() must exist and return proper structure
  expect(typeof locale.getWeekInfo).toBe('function')

  const weekInfo = locale.getWeekInfo()
  expect(weekInfo).toHaveProperty('firstDay')
  expect(weekInfo).toHaveProperty('weekend')
  expect(weekInfo).toHaveProperty('minimalDays')

  // en-US uses Sunday (7) as first day of week
  expect(weekInfo.firstDay).toBe(7)
  expect(weekInfo.minimalDays).toBe(1)

  // Test other locales that might have different week info
  const localeDe = new Locale('de-DE')
  const weekInfoDe = localeDe.getWeekInfo()
  // Germany uses Monday (1) as first day of week
  expect(weekInfoDe.firstDay).toBe(1)
  expect(weekInfoDe.minimalDays).toBe(4)
})

test('GH #5112 - All Intl Locale Info methods should be available', function () {
  // Issue #5112: Incomplete implementations may be missing multiple methods
  // from the Intl Locale Info proposal. Ensure all are present.

  const locale = new Locale('en-US')

  // All these methods must exist (part of Intl Locale Info proposal)
  expect(typeof locale.getWeekInfo).toBe('function')
  expect(typeof locale.getCalendars).toBe('function')
  expect(typeof locale.getCollations).toBe('function')
  expect(typeof locale.getHourCycles).toBe('function')
  expect(typeof locale.getNumberingSystems).toBe('function')
  expect(typeof locale.getTimeZones).toBe('function')
  expect(typeof locale.getTextInfo).toBe('function')

  // Verify they return proper data
  expect(Array.isArray(locale.getCalendars())).toBe(true)
  expect(Array.isArray(locale.getCollations())).toBe(true)
  expect(Array.isArray(locale.getHourCycles())).toBe(true)
  expect(Array.isArray(locale.getNumberingSystems())).toBe(true)
  expect(typeof locale.getTextInfo()).toBe('object')
  expect(typeof locale.getWeekInfo()).toBe('object')
})
