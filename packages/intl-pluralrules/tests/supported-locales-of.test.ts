import '@formatjs/intl-getcanonicallocales/polyfill'
import '@formatjs/intl-locale/polyfill'
import {PluralRules} from '../'
import {describe, expect, it} from 'vitest'
// @ts-ignore
import zh from './locale-data/zh'
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

  if ((PluralRules as any).polyfilled) {
    it('should return correct locales that we only have data for', test)
  } else {
    it.skip('should return correct locales that we only have data for', test)
  }
})
