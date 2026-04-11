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
import RelativeTimeFormat from '#packages/intl-relativetimeformat/index.js'
import {describe, expect, it} from 'vitest'
RelativeTimeFormat.__addLocaleData(en, enAI, zh, zhHans, zhHant)

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
})
