/// <reference types="jest" />

import '@formatjs/intl-getcanonicallocales/polyfill'
import '@formatjs/intl-locale/polyfill'

import '@formatjs/intl-listformat/polyfill-force'
import '@formatjs/intl-numberformat/polyfill-force'

import '@formatjs/intl-numberformat/locale-data/en'
import '@formatjs/intl-listformat/locale-data/en'
import '@formatjs/intl-numberformat/locale-data/en-AI'
import '@formatjs/intl-listformat/locale-data/en-AI'
import '@formatjs/intl-numberformat/locale-data/zh'
import '@formatjs/intl-listformat/locale-data/zh'
import '@formatjs/intl-numberformat/locale-data/zh-Hans'
import '@formatjs/intl-listformat/locale-data/zh-Hans'
import '@formatjs/intl-numberformat/locale-data/zh-Hant'
import '@formatjs/intl-listformat/locale-data/zh-Hant'

import DurationFormat from '..'
import * as en from './locale-data/en.json'
import * as enAI from './locale-data/en-AI.json'
import * as zh from './locale-data/zh.json'
import * as zhHant from './locale-data/zh-Hant.json'
import * as zhHans from './locale-data/zh-Hans.json'
DurationFormat.__addLocaleData(en, enAI, zh, zhHans, zhHant)

describe('Intl.Duration', function () {
  it('should support aliases', function () {
    expect(new DurationFormat('zh-CN').format({years: 10})).toBe('10年')
    expect(new DurationFormat('zh-CN').format({years: 10, days: 5})).toBe(
      '10年5天'
    )
    expect(
      new DurationFormat('zh-TW').format({years: 10, months: 2, days: 5})
    ).toBe('10 年 2 個月 5 天')
    expect(new DurationFormat('zh-TW').format({years: 10, days: 5})).toBe(
      '10 年 5 天'
    )
  })
  it('should resolve parent correctly', function () {
    expect(new DurationFormat('en-AI').format({years: 10, days: 5})).toBe(
      '10 yrs, 5 days'
    )
    // Node 12 has an old version of CLDR
    if (process.version && process.version.startsWith('v10')) {
      expect(
        new DurationFormat('en-AI').format({years: 10, months: 2, days: 5})
      ).toBe('10 yrs, 2 mths, 5 days')
    }
  })
  it('should normalize case correctly', function () {
    const lf = new DurationFormat('en-ai', {style: 'short'})
    expect(lf.resolvedOptions()).toEqual(
      expect.objectContaining({
        locale: 'en-AI',
      })
    )
  })
})
