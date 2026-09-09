import {getCanonicalLocales} from '@formatjs/intl-getcanonicallocales'
import '@formatjs/intl-getcanonicallocales/polyfill.js'
import {Locale} from '#packages/intl-locale/index.js'
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
        'islamic-civil',
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
        'islamic-civil',
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
  // Keep getWeekInfo available with the current ECMA-402 result shape.

  const locale = new Locale('en-US')

  // getWeekInfo() must exist and return proper structure
  expect(typeof locale.getWeekInfo).toBe('function')

  const weekInfo = locale.getWeekInfo()
  expect(weekInfo).toHaveProperty('firstDay')
  expect(weekInfo).toHaveProperty('weekend')
  expect(Object.keys(weekInfo)).toEqual(['firstDay', 'weekend'])

  // en-US uses Sunday (7) as first day of week
  expect(weekInfo.firstDay).toBe(7)

  // Test other locales that might have different week info
  const localeDe = new Locale('de-DE')
  const weekInfoDe = localeDe.getWeekInfo()
  // Germany uses Monday (1) as first day of week
  expect(weekInfoDe.firstDay).toBe(1)
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

test('canonicalizes weekday options without discarding string identifiers', () => {
  for (const [input, expected] of [
    ['mon', 'mon'],
    ['MON', 'mon'],
    ['7', 'sun'],
    ['0', 'sun'],
    ['1', 'mon'],
    ['foo-bar', 'foo-bar'],
  ]) {
    const locale = new Locale('en', {firstDayOfWeek: input})
    expect(locale.firstDayOfWeek).toBe(expected)
    expect(locale.toString()).toBe(`en-u-fw-${expected}`)
  }
  for (const input of ['8', '1.0', '01', '', 'a_b']) {
    expect(() => new Locale('en', {firstDayOfWeek: input})).toThrow(RangeError)
  }
})
test('treats an empty numeric keyword as true', () => {
  expect(new Locale('en-u-kn').numeric).toBe(true)
  expect(new Locale('en-u-kn-true').numeric).toBe(true)
  expect(new Locale('en-u-kn-false').numeric).toBe(false)
  expect(new Locale('en-u-kn', {numeric: false}).numeric).toBe(false)
})

test('returns numeric weekdays and independent weekend arrays', () => {
  const locale = new Locale('en-US', {firstDayOfWeek: 'mon'})
  expect(locale.getWeekInfo()).toEqual({firstDay: 1, weekend: [6, 7]})
  const info = locale.getWeekInfo()
  info.weekend.length = 0
  expect(locale.getWeekInfo().weekend).toEqual([6, 7])
  expect(new Locale('en-US-u-fw-sun').getWeekInfo().firstDay).toBe(7)
  expect(new Locale('en-US-u-fw-foobar').getWeekInfo().firstDay).toBe(7)
})
test('uses region and subdivision preferences for week data', () => {
  expect(new Locale('en-US-u-rg-gbzzzz').getWeekInfo().firstDay).toBe(1)
  expect(new Locale('en-US-u-rg-aazzzz').getWeekInfo().firstDay).toBe(7)
  expect(new Locale('en-US-u-fw-sun-rg-gbzzzz').getWeekInfo().firstDay).toBe(7)
  expect(new Locale('en-u-sd-gbeng').getWeekInfo().firstDay).toBe(1)
  expect(new Locale('en-US-u-sd-gbeng').getWeekInfo().firstDay).toBe(7)
})

test('Locale intrinsic supports canonicalization after polyfill installation', () => {
  const NativeLocale = Intl.Locale
  const native = new NativeLocale('fr')
  const locale = new Locale('en')
  Object.defineProperty(locale, 'toString', {
    value() {
      throw new Error('must not call')
    },
  })
  try {
    Object.defineProperty(Intl, 'Locale', {value: Locale})
    expect(getCanonicalLocales(locale as any)).toEqual(['en'])
    expect(getCanonicalLocales([locale, native] as any)).toEqual(['en', 'fr'])
    expect(() => Locale.prototype.toString.call({} as any)).toThrow(TypeError)
  } finally {
    Object.defineProperty(Intl, 'Locale', {value: NativeLocale})
  }
})

describe('Locale internal brand', () => {
  const getters = [
    'baseName',
    'calendar',
    'collation',
    'caseFirst',
    'numeric',
    'numberingSystem',
    'language',
    'script',
    'region',
    'variants',
    'firstDayOfWeek',
    'hourCycle',
  ] as const
  const fake = Object.create(Locale.prototype)
  const receivers = [
    undefined,
    null,
    1,
    'en',
    Symbol('locale'),
    {},
    () => {},
    fake,
    new Proxy(new Locale('en'), {}),
  ]
  it.each(getters)(
    '%s rejects receivers without Locale slots repeatedly',
    name => {
      const get = Object.getOwnPropertyDescriptor(Locale.prototype, name)!.get!
      for (const receiver of receivers) {
        expect(() => get.call(receiver)).toThrow(TypeError)
        expect(() => get.call(receiver)).toThrow(TypeError)
      }
    }
  )
  it.each(['getCollations', 'getNumberingSystems'] as const)(
    '%s rejects unbranded receivers',
    method => {
      for (const receiver of receivers) {
        expect(() => Locale.prototype[method].call(receiver)).toThrow(TypeError)
      }
    }
  )
  it('copies genuine Locale slots without reading an own toString', () => {
    const original = new Locale('en-u-ca-buddhist')
    Object.defineProperty(original, 'toString', {
      get() {
        throw new Error('must not read')
      },
    })
    expect(new Locale(original).calendar).toBe('buddhist')
    expect(new Locale({toString: () => 'fr'} as any).language).toBe('fr')
  })
})

test('locale tag coercion uses the string hint and ordinary fallback', () => {
  const hints: string[] = []
  const tag = {
    [Symbol.toPrimitive](hint: string) {
      hints.push(hint)
      return 'en-US'
    },
    toString() {
      throw new Error('must not call toString')
    },
  }
  expect(new Locale(tag as unknown as string).toString()).toBe('en-US')
  expect(hints).toEqual(['string'])
  expect(
    new Locale({
      toString: undefined,
      valueOf: () => 'de',
    } as unknown as string).toString()
  ).toBe('de')
  const callable = Object.assign(() => {}, {toString: () => 'fr'})
  expect(new Locale(callable as unknown as string).toString()).toBe('fr')
  expect(() => new Locale(null as unknown as string)).toThrow(TypeError)
})

test('variants options replace existing variants and preserve extensions', () => {
  const locale = new Locale('de-1901-u-nu-latn', {variants: '1996'})
  expect(locale.toString()).toBe('de-1996-u-nu-latn')
  expect(locale.variants).toBe('1996')
  expect(new Locale('en', {variants: 'FONIPA'}).variants).toBe('fonipa')
})

test.each(['', 'abcd', '1996-1996', 'POSIX-posix', '1996-', '1996-u-nu-latn'])(
  'rejects invalid variants option %s',
  variants => {
    expect(() => new Locale('en', {variants})).toThrow(RangeError)
  }
)

test('canonicalizes the original locale before applying language overrides', () => {
  expect(new Locale('und-Armn-SU', {language: 'ru'}).toString()).toBe(
    'ru-Armn-AM'
  )
})

it.each([
  ['fa-JP-u-sd-inka-rg-thzzzz', 'fa-TH'],
  ['fa-JP-u-sd-inka', 'fa-JP'],
  ['fa-u-sd-inka', 'fa-IN'],
  ['en-US-u-rg-zzzzzz', 'en-US'],
])('calendar and hour-cycle preferences for %s follow %s', (tag, reference) => {
  const locale = new Locale(tag)
  const expected = new Locale(reference)
  expect(locale.getCalendars()).toEqual(expected.getCalendars())
  expect(locale.getHourCycles()).toEqual(expected.getHourCycles())
})

it('stores canonical Unicode option values in locale getters', () => {
  const locale = new Locale('en', {
    calendar: 'ISLAMICC',
    collation: 'DICT',
    numberingSystem: 'LATN',
    numeric: true,
  })
  expect(locale.calendar).toBe('islamic-civil')
  expect(locale.collation).toBe('dict')
  expect(locale.numberingSystem).toBe('latn')
  expect(locale.numeric).toBe(true)
  expect(locale.toString()).toBe('en-u-ca-islamic-civil-co-dict-kn-nu-latn')
})
