/* eslint-disable @typescript-eslint/no-var-requires */
import '@formatjs/intl-getcanonicallocales/polyfill.js'
import '@formatjs/intl-locale/polyfill.js'
import {DisplayNames} from '../index.js'
import {describe, expect, it} from 'vitest'

import * as en from './locale-data/en.json' with {type: 'json'}
import * as zh from './locale-data/zh.json' with {type: 'json'}
DisplayNames.__addLocaleData(en, zh)

describe('.of()', () => {
  describe('with type set to "language"', () => {
    it('accepts case-insensitive language code with region subtag', () => {
      expect(new DisplayNames('zh', {type: 'language'}).of('zh-hANs-sG')).toBe(
        '简体中文（新加坡）'
      )
    })

    it('preserves unrecognized region subtag in language code when fallback option is code', () => {
      expect(
        new DisplayNames('zh', {type: 'language', fallback: 'code'}).of(
          'zh-Hans-Xy'
        )
      ).toBe('简体中文（XY）')
    })

    it('finds the long style language correctly', () => {
      expect(
        new DisplayNames('en', {type: 'language', style: 'long'}).of('en-GB')
      ).toBe('British English')
    })

    it('finds the short style language correctly', () => {
      expect(
        new DisplayNames('en', {type: 'language', style: 'short'}).of('en-GB')
      ).toBe('UK English')
    })

    describe('with languageDisplay set to "dialect"', () => {
      it('finds the style language correctly', () => {
        expect(
          new Intl.DisplayNames('en', {
            type: 'language',
            languageDisplay: 'dialect',
          }).of('en-GB')
        ).toBe('British English')
      })
    })

    describe('with languageDisplay set to "standard"', () => {
      it('finds the long style language correctly', () => {
        expect(
          new DisplayNames('en', {
            type: 'language',
            style: 'long',
            languageDisplay: 'standard',
          }).of('en-GB')
        ).toBe('English (United Kingdom)')
      })

      it('finds the short style language correctly', () => {
        expect(
          new DisplayNames('en', {
            type: 'language',
            style: 'short',
            languageDisplay: 'standard',
          }).of('en-GB')
        ).toBe('English (UK)')
      })
    })

    describe('with fallback set to "none"', () => {
      it('returns undefined when called with language code that has unrecognized region subtag', () => {
        expect(
          new DisplayNames('zh', {type: 'language', fallback: 'none'}).of(
            'zh-Hans-XY'
          )
        ).toBe(undefined)
      })

      it('returns undefined when called with language code that valid region subtag but invalid language subtag', () => {
        expect(
          new DisplayNames('zh', {type: 'language', fallback: 'none'}).of(
            'xx-CN'
          )
        ).toBe(undefined)
      })
    })
  })

  it('accepts case-insensitive currency code', () => {
    expect(
      new DisplayNames('en-US', {type: 'currency', style: 'long'}).of('cNy')
    ).toBe('Chinese Yuan')
  })

  it('finds script correctly', function () {
    expect(
      new DisplayNames('zh', {type: 'script', fallback: 'code'}).of('arab')
    ).toBe('阿拉伯文')
  })

  // https://github.com/formatjs/formatjs/issues/3387
  describe('GH #3387: calendar type support', () => {
    it('finds the calendar correctly with long style', () => {
      expect(new DisplayNames('en', {type: 'calendar'}).of('roc')).toBe(
        'Minguo Calendar'
      )
    })

    it('finds calendar names with different styles', () => {
      // Use valid calendar codes (3-8 chars or with hyphens)
      expect(
        new DisplayNames('en', {type: 'calendar', style: 'long'}).of('buddhist')
      ).toBe('Buddhist Calendar')
      // Short and narrow styles fall back to long when not defined
      expect(
        new DisplayNames('en', {type: 'calendar', style: 'short'}).of('chinese')
      ).toBe('Chinese Calendar')
      expect(
        new DisplayNames('en', {type: 'calendar', style: 'narrow'}).of('coptic')
      ).toBe('Coptic Calendar')
    })

    it('finds multiple calendar types with actual values', () => {
      const dn = new DisplayNames('en', {type: 'calendar'})
      expect(dn.of('buddhist')).toBe('Buddhist Calendar')
      expect(dn.of('chinese')).toBe('Chinese Calendar')
      expect(dn.of('hebrew')).toBe('Hebrew Calendar')
      expect(dn.of('islamic')).toBe('Hijri Calendar')
      expect(dn.of('japanese')).toBe('Japanese Calendar')
      expect(dn.of('persian')).toBe('Persian Calendar')
      expect(dn.of('ethiopic')).toBe('Ethiopic Calendar')
      expect(dn.of('coptic')).toBe('Coptic Calendar')
      expect(dn.of('iso8601')).toBe('Gregorian Calendar (ISO 8601 Weeks)')
    })

    it('handles calendar codes with hyphens', () => {
      const dn = new DisplayNames('en', {type: 'calendar'})
      // These have hyphens so they match the pattern [a-z0-9]{3,8}([-_][a-z0-9]{3,8})*
      expect(dn.of('islamic-civil')).toBe(
        'Hijri Calendar (tabular, civil epoch)'
      )
      expect(dn.of('ethiopic-amete-alem')).toBe('Ethiopic Amete Alem Calendar')
    })

    it('handles calendar codes case-insensitively (canonicalizes to lowercase)', () => {
      expect(new DisplayNames('en', {type: 'calendar'}).of('BUDDHIST')).toBe(
        'Buddhist Calendar'
      )
      expect(new DisplayNames('en', {type: 'calendar'}).of('BuDdHiSt')).toBe(
        'Buddhist Calendar'
      )
    })

    it('throws RangeError for invalid calendar code pattern', () => {
      // 'gregorian' is 9 chars without hyphens, violates pattern
      expect(() => {
        new DisplayNames('en', {type: 'calendar'}).of('gregorian')
      }).toThrow(RangeError)
      // 'unknowncalendar' is too long without hyphens
      expect(() => {
        new DisplayNames('en', {type: 'calendar'}).of('unknowncalendar')
      }).toThrow(RangeError)
    })

    it('returns undefined for valid but unknown calendar code with fallback none', () => {
      // 'abc' is valid pattern but no data exists, with fallback='none' returns undefined
      expect(
        new DisplayNames('en', {type: 'calendar', fallback: 'none'}).of('abc')
      ).toBeUndefined()
    })

    it('returns code for unknown calendar with default fallback', () => {
      // Default fallback is 'code', so returns the code itself
      expect(new DisplayNames('en', {type: 'calendar'}).of('abc')).toBe('abc')
    })

    it('returns code with explicit fallback code option', () => {
      expect(
        new DisplayNames('en', {type: 'calendar', fallback: 'code'}).of('xyz')
      ).toBe('xyz')
    })
  })

  // https://github.com/formatjs/formatjs/issues/3387
  describe('GH #3387: dateTimeField type support', () => {
    it('finds the name for "year" correctly', () => {
      expect(new DisplayNames('en', {type: 'dateTimeField'}).of('year')).toBe(
        'year'
      )
    })

    it('finds all valid dateTimeField codes with long style', () => {
      const dn = new DisplayNames('en', {type: 'dateTimeField', style: 'long'})
      expect(dn.of('era')).toBe('era')
      expect(dn.of('year')).toBe('year')
      expect(dn.of('quarter')).toBe('quarter')
      expect(dn.of('month')).toBe('month')
      expect(dn.of('weekOfYear')).toBe('week')
      expect(dn.of('weekday')).toBe('day of the week')
      expect(dn.of('day')).toBe('day')
      // dayPeriod is valid but returns its code since data uses lowercase key
      expect(dn.of('dayPeriod')).toBeDefined()
      expect(dn.of('hour')).toBe('hour')
      expect(dn.of('minute')).toBe('minute')
      expect(dn.of('second')).toBe('second')
      expect(dn.of('timeZoneName')).toBe('time zone')
    })

    it('finds dateTimeField codes with short style', () => {
      const dn = new DisplayNames('en', {
        type: 'dateTimeField',
        style: 'short',
      })
      expect(dn.of('year')).toBe('yr.')
      expect(dn.of('month')).toBe('mo.')
      expect(dn.of('weekOfYear')).toBe('wk.')
      expect(dn.of('day')).toBe('day')
      expect(dn.of('hour')).toBe('hr.')
      expect(dn.of('minute')).toBe('min.')
      expect(dn.of('second')).toBe('sec.')
      expect(dn.of('timeZoneName')).toBe('zone')
    })

    it('finds dateTimeField codes with narrow style', () => {
      const dn = new DisplayNames('en', {
        type: 'dateTimeField',
        style: 'narrow',
      })
      expect(dn.of('year')).toBe('yr')
      expect(dn.of('month')).toBe('mo')
      expect(dn.of('weekOfYear')).toBe('wk')
      expect(dn.of('day')).toBe('day')
      expect(dn.of('hour')).toBe('hr')
      expect(dn.of('minute')).toBe('min')
      expect(dn.of('second')).toBe('sec')
      expect(dn.of('timeZoneName')).toBe('zone')
    })

    it('throws RangeError for invalid dateTimeField code', () => {
      // Invalid codes throw RangeError per ECMA-402 spec
      expect(() => {
        new DisplayNames('en', {type: 'dateTimeField'}).of('invalidfield')
      }).toThrow(RangeError)
    })

    it('validates all dateTimeField codes from spec', () => {
      const dn = new DisplayNames('en', {type: 'dateTimeField'})
      // All valid codes from IsValidDateTimeFieldCode
      const validCodes = [
        'era',
        'year',
        'quarter',
        'month',
        'weekOfYear',
        'weekday',
        'day',
        'dayPeriod',
        'hour',
        'minute',
        'second',
        'timeZoneName',
      ]
      validCodes.forEach(code => {
        expect(() => dn.of(code)).not.toThrow()
      })
    })
  })
})

describe('.resolvedOptions()', () => {
  describe('option "languageDisplay"', () => {
    it('defaults to "dialect" when the option is omitted and type is "language"', () => {
      expect(
        new DisplayNames('en', {type: 'language'}).resolvedOptions()
          .languageDisplay
      ).toBe('dialect')
    })

    it('is undefined when the option is omitted and type is not "language"', () => {
      expect(
        new DisplayNames('en', {type: 'currency'}).resolvedOptions()
          .languageDisplay
      ).toBeUndefined()
    })
  })
})

// TODO: add snapshot tests
