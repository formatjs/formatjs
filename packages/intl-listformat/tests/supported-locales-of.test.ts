import '@formatjs/intl-getcanonicallocales/polyfill.js'
import '@formatjs/intl-locale/polyfill.js'
import ListFormat from '../index.js'
import * as en from './locale-data/en.json' with {type: 'json'}
import * as enAI from './locale-data/en-AI.json' with {type: 'json'}
import * as zh from './locale-data/zh.json' with {type: 'json'}
import * as zhHant from './locale-data/zh-Hant.json' with {type: 'json'}
import * as zhHans from './locale-data/zh-Hans.json' with {type: 'json'}
import {describe, expect, it} from 'vitest'
ListFormat.__addLocaleData(en, enAI, zh, zhHans, zhHant)

describe('supportedLocalesOf', function () {
  function test() {
    expect(ListFormat.supportedLocalesOf(['zh', 'en-jj'])).toContain('zh')
    expect(ListFormat.supportedLocalesOf('fr')).toEqual([])
  }

  it.skipIf(!ListFormat.polyfilled)(
    'should return correct locales that we only have data for',
    test
  )
})
