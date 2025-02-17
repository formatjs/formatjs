import '@formatjs/intl-getcanonicallocales/polyfill'
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
      expect(locale.getCollations()).toEqual(['compat', 'emoji', 'eor'])
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
      expect(locale.getCollations()).toEqual(['compat', 'emoji', 'eor'])
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
      expect(locale.getCollations()).toEqual(['compat', 'emoji', 'eor'])
      expect(locale.getHourCycles()).toEqual(['h12', 'h23'])
      expect(locale.getNumberingSystems()).toEqual(['arab'])
      expect(JSON.stringify(locale.getTimeZones())).toMatch(
        JSON.stringify(['Asia/Riyadh'])
      )
    })

    it('ja', () => {
      const locale = new Locale('ja')
      expect(locale.getCalendars()).toEqual(['gregory', 'japanese'])
      expect(locale.getCollations()).toEqual(['emoji', 'eor', 'unihan'])
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
