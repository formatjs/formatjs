import '@formatjs/intl-getcanonicallocales/polyfill'
import {Locale} from '../'

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
      expect(locale.calendars).toEqual([
        'gregory',
        'coptic',
        'islamic',
        'islamicc',
        'islamic-tbla',
      ])
      expect(locale.collations).toEqual(['compat', 'emoji', 'eor'])
      expect(locale.hourCycles).toEqual(['h12', 'h23'])
      expect(locale.numberingSystems).toEqual(['arab'])
      expect(locale.timeZones).toBe(undefined)
    })

    it('ar-EG', () => {
      const locale = new Locale('ar-EG')
      expect(locale.calendars).toEqual([
        'gregory',
        'coptic',
        'islamic',
        'islamicc',
        'islamic-tbla',
      ])
      expect(locale.collations).toEqual(['compat', 'emoji', 'eor'])
      expect(locale.hourCycles).toEqual(['h12', 'h23'])
      expect(locale.numberingSystems).toEqual(['arab'])
      expect(JSON.stringify(locale.timeZones)).toMatch(
        JSON.stringify(['Africa/Cairo'])
      )
    })

    it('ar-SA', () => {
      const locale = new Locale('ar-SA')
      expect(locale.calendars).toEqual([
        'islamic-umalqura',
        'gregory',
        'islamic',
        'islamic-rgsa',
      ])
      expect(locale.collations).toEqual(['compat', 'emoji', 'eor'])
      expect(locale.hourCycles).toEqual(['h12', 'h23'])
      expect(locale.numberingSystems).toEqual(['arab'])
      expect(JSON.stringify(locale.timeZones)).toMatch(
        JSON.stringify(['Asia/Riyadh'])
      )
    })

    it('ja', () => {
      const locale = new Locale('ja')
      expect(locale.calendars).toEqual(['gregory', 'japanese'])
      expect(locale.collations).toEqual(['emoji', 'eor', 'unihan'])
      expect(locale.hourCycles).toEqual(['h23', 'h12', 'h11'])
      expect(locale.numberingSystems).toEqual(['latn', 'jpan', 'jpanfin'])
      expect(locale.timeZones).toBe(undefined)
    })

    it('pt-BR', () => {
      const locale = new Locale('pt-BR')
      expect(locale.calendars).toEqual(['gregory'])
      expect(locale.collations).toEqual(['emoji', 'eor'])
      expect(locale.hourCycles).toEqual(['h23'])
      expect(locale.numberingSystems).toEqual(['latn'])
      expect(JSON.stringify(locale.timeZones)).toMatch(
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
