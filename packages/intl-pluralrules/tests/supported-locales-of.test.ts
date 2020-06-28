import '@formatjs/intl-getcanonicallocales/polyfill';
import {PluralRules} from '../src';
// @ts-ignore
import * as zh from './locale-data/zh.js';
// @ts-ignore
PluralRules.__addLocaleData(zh.default || zh);

describe('supportedLocalesOf', function () {
  function test() {
    expect(PluralRules.supportedLocalesOf(['zh', 'en-jj'])).toContain('zh');
    // FIXME: Only run this in Node since in browsers other tests populate PluralRules :(
    if (process.version) {
      expect(PluralRules.supportedLocalesOf(['fr'])).toEqual([]);
    }
  }

  if ((PluralRules as any).polyfilled) {
    it('should return correct locales that we only have data for', test);
  } else {
    xit('should return correct locales that we only have data for', test);
  }
});
