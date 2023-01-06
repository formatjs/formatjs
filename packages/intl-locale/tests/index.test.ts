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

  describe('tc39-intl-locale-info/proposal-defaults', () => {
    it('ar', () => {
      const ar = new Locale('ar')
      expect(ar.calendars).toEqual(['gregory', 'coptic', 'islamic', 'islamicc', 'islamic-tbla'])
      // expect(ar.collations).toEqual(["compat", "emoji", "eor"])
      expect(ar.hourCycles).toEqual(['h12', 'h23'])
      expect(ar.numberingSystems).toEqual(['latn'])
      expect(ar.timeZones).toBe(undefined)
    })

    it('ar-EG', () => {
      const ar = new Locale('ar-EG')
      expect(ar.calendars).toEqual(['gregory', 'coptic', 'islamic', 'islamicc', 'islamic-tbla'])
      // expect(ar.collations).toEqual(["compat", "emoji", "eor"])
      expect(ar.hourCycles).toEqual(['h12', 'h23'])
      expect(ar.numberingSystems).toEqual(['latn'])
      expect(ar.timeZones).toEqual(['Africa/Cairo'])
    })

    it('ar-SA', () => {
      const ar = new Locale('ar-SA')
      expect(ar.calendars).toEqual(['islamic-umalqura', 'gregory', 'islamic', 'islamic-rgsa'])
      // expect(ar.collations).toEqual(["compat", "emoji", "eor"])
      expect(ar.hourCycles).toEqual(['h12', 'h23'])
      expect(ar.numberingSystems).toEqual(['latn'])
      expect(ar.timeZones).toEqual([])
    })

    it('ja', () => {
      const ar = new Locale('ja')
      expect(ar.calendars).toEqual(['gregory', 'japanese'])
      // expect(ar.collations).toEqual(["compat", "emoji", "eor"])
      expect(ar.hourCycles).toEqual(['h23', 'h12', 'h11'])
      expect(ar.numberingSystems).toEqual(['latn'])
      expect(ar.timeZones).toBe(undefined)
    })
  })
})
