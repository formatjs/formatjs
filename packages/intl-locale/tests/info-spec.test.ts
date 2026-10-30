import {Locale} from '#packages/intl-locale/index.js'
import {describe, expect, it} from 'vitest'

describe('Locale information follows script metadata and formatter defaults', () => {
  it('deduplicates primary time zones after alias normalization', () => {
    const zones = new Locale('en-US').getTimeZones()!
    expect(zones.filter(zone => zone === 'America/Denver')).toHaveLength(1)
    expect(zones).toEqual([...new Set(zones)].sort())
  })
  for (const tag of ['ar-u-ca-gregory', 'en-Arab', 'abcde-Arab']) {
    it(`retains script direction for ${tag}`, () => {
      expect(new Locale(tag).getTextInfo()).toEqual({direction: 'rtl'})
    })
  }
  it('honors explicit Latin script over Arabic language', () => {
    expect(new Locale('ar-Latn').getTextInfo()).toEqual({direction: 'ltr'})
  })
  for (const tag of ['und-Zzzz', 'abcde']) {
    it(`preserves an own undefined direction for ${tag}`, () => {
      expect(
        Object.getOwnPropertyDescriptor(
          new Locale(tag).getTextInfo(),
          'direction'
        )
      ).toEqual({
        value: undefined,
        writable: true,
        enumerable: true,
        configurable: true,
      })
    })
  }
  it('returns one NumberFormat default independent of unrelated extensions', () => {
    const expected = new Intl.NumberFormat('ar-EG', {
      localeMatcher: 'lookup',
    }).resolvedOptions().numberingSystem
    expect(new Locale('ar-EG').getNumberingSystems()).toEqual([expected])
    expect(new Locale('ar-EG-u-ca-gregory').getNumberingSystems()).toEqual([
      expected,
    ])
    expect(new Locale('abcde').getNumberingSystems()).toEqual(['latn'])
  })
  it('uses an explicit numbering system even with no formatter installed', () => {
    const descriptor = Object.getOwnPropertyDescriptor(Intl, 'NumberFormat')!
    try {
      Object.defineProperty(Intl, 'NumberFormat', {value: undefined})
      expect(new Locale('ar-EG-u-nu-arab').getNumberingSystems()).toEqual([
        'arab',
      ])
      expect(new Locale('ar-EG').getNumberingSystems()).toEqual(['latn'])
    } finally {
      Object.defineProperty(Intl, 'NumberFormat', descriptor)
    }
  })
})
