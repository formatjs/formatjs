import '@formatjs/intl-getcanonicallocales/polyfill.js'
import '@formatjs/intl-locale/polyfill.js'
import {PluralRules} from '#packages/intl-pluralrules/'
import {describe, expect, it} from 'vitest'
// @ts-ignore
import zh from '#packages/intl-pluralrules/tests/locale-data/zh.js'
// @ts-ignore
PluralRules.__addLocaleData(zh)

describe('supportedLocalesOf', function () {
  function test() {
    expect(PluralRules.supportedLocalesOf(['zh', 'en-jj'])).toContain('zh')
    // FIXME: Only run this in Node since in browsers other tests populate PluralRules :(
    if (process.version) {
      expect(PluralRules.supportedLocalesOf(['fr'])).toEqual([])
    }
  }

  it.skipIf(!(PluralRules as any).polyfilled)(
    'should return correct locales that we only have data for',
    test
  )
})
