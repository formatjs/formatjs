import '@formatjs/intl-getcanonicallocales/polyfill'
import '@formatjs/intl-locale/polyfill'
import '@formatjs/intl-pluralrules/polyfill'
import '@formatjs/intl-pluralrules/locale-data/en'
import '@formatjs/intl-pluralrules/locale-data/zh'
import * as zh from './locale-data/zh.json'
import * as zhHant from './locale-data/zh-Hant.json'
import * as zhHans from './locale-data/zh-Hans.json'
import * as en from './locale-data/en.json'
import * as enAI from './locale-data/en-AI.json'
import RelativeTimeFormat from '..'
import {describe, expect, it} from 'vitest'
RelativeTimeFormat.__addLocaleData(en, enAI, zh, zhHans, zhHant)

describe('supportedLocalesOf', function () {
  function test() {
    expect(RelativeTimeFormat.supportedLocalesOf(['zh', 'en-jj'])).toContain(
      'zh'
    )
  }

  it.skipIf(!RelativeTimeFormat.polyfilled)(
    'should return correct locales that we only have data for',
    test
  )
})
