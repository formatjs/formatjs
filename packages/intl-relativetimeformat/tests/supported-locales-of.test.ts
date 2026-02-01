import '@formatjs/intl-getcanonicallocales/polyfill.js'
import '@formatjs/intl-locale/polyfill.js'
import '@formatjs/intl-pluralrules/polyfill.js'
import '@formatjs/intl-pluralrules/locale-data/en'
import '@formatjs/intl-pluralrules/locale-data/zh'
import zh from './locale-data/zh.json' with {type: 'json'}
import zhHant from './locale-data/zh-Hant.json' with {type: 'json'}
import zhHans from './locale-data/zh-Hans.json' with {type: 'json'}
import en from './locale-data/en.json' with {type: 'json'}
import enAI from './locale-data/en-AI.json' with {type: 'json'}
import RelativeTimeFormat from '../index.js'
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
