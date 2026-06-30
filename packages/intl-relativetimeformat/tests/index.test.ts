import '@formatjs/intl-getcanonicallocales/polyfill.js'
import '@formatjs/intl-locale/polyfill.js'
import '@formatjs/intl-pluralrules/polyfill.js'
import '@formatjs/intl-pluralrules/locale-data/zh'
import '@formatjs/intl-pluralrules/locale-data/en'
import zh from '#packages/intl-relativetimeformat/tests/locale-data/zh.json' with {type: 'json'}
import zhHant from '#packages/intl-relativetimeformat/tests/locale-data/zh-Hant.json' with {type: 'json'}
import zhHans from '#packages/intl-relativetimeformat/tests/locale-data/zh-Hans.json' with {type: 'json'}
import en from '#packages/intl-relativetimeformat/tests/locale-data/en.json' with {type: 'json'}
import enAI from '#packages/intl-relativetimeformat/tests/locale-data/en-AI.json' with {type: 'json'}
import bn from '#packages/intl-relativetimeformat/tests/locale-data/bn.json' with {type: 'json'}
import my from '#packages/intl-relativetimeformat/tests/locale-data/my.json' with {type: 'json'}
import ne from '#packages/intl-relativetimeformat/tests/locale-data/ne.json' with {type: 'json'}
import RelativeTimeFormat from '#packages/intl-relativetimeformat/index.js'
import {describe, expect, it} from 'vitest'
RelativeTimeFormat.__addLocaleData(en, enAI, zh, zhHans, zhHant, bn, my, ne)

describe('Intl.RelativeTimeFormat', function () {
  it('should lookup zh-CN', function () {
    expect(new RelativeTimeFormat('zh-CN').format(-1, 'second')).toBe('1秒钟前')
  })
  it('should lookup zh-TW', function () {
    expect(new RelativeTimeFormat('zh-TW').format(-1, 'second')).toBe('1 秒前')
    expect(
      new RelativeTimeFormat('zh-TW', {
        style: 'short',
        numeric: 'auto',
      }).format(-1, 'seconds')
    ).toBe('1 秒前')
  })
  it('should resolve parent correctly', function () {
    expect(new RelativeTimeFormat('en-AI').format(-1, 'second')).toBe(
      '1 second ago'
    )
  })
  it('honors the numberingSystem option for locales that default to non-latn digits', function () {
    for (const locale of ['my-MM', 'bn-BD', 'ne-NP']) {
      const rtf = new RelativeTimeFormat(locale, {
        numberingSystem: 'latn',
      } as Intl.RelativeTimeFormatOptions)
      expect(rtf.resolvedOptions().numberingSystem).toBe('latn')
      const formatted = rtf.format(1, 'day')
      expect(formatted).toMatch(/[0-9]/)
      expect(formatted).not.toMatch(
        /[\u1040-\u1049\u09e6-\u09ef\u0966-\u096f]/u
      )
    }
  })
})
