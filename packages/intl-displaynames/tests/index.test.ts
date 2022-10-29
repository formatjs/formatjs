/* eslint-disable @typescript-eslint/no-var-requires */
import '@formatjs/intl-getcanonicallocales/polyfill'
import '@formatjs/intl-locale/polyfill'
import {DisplayNames} from '..'

import * as en from './locale-data/en.json'
import * as zh from './locale-data/zh.json'
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

  it('finds the calendar correctly', () => {
    expect(new DisplayNames('en', {type: 'calendar'}).of('roc')).toBe(
      'Minguo Calendar'
    )
  })

  describe('with type set to "dateTimeField"', () => {
    it('finds the name for "year" correctly', () => {
      expect(new DisplayNames('en', {type: 'dateTimeField'}).of('year')).toBe(
        'year'
      )
    })

    it('finds the short name for "weekOfYear" correctly', () => {
      expect(
        new DisplayNames('en', {type: 'dateTimeField', style: 'short'}).of(
          'weekOfYear'
        )
      ).toBe('wk.')
    })

    it('finds the narrow name for "timeZoneName" correctly', () => {
      expect(
        new DisplayNames('en', {type: 'dateTimeField', style: 'narrow'}).of(
          'timeZoneName'
        )
      ).toBe('zone')
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
