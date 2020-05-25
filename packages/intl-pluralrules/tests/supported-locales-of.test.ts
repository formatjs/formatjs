import '@formatjs/intl-getcanonicallocales/polyfill';
import {PluralRules} from '../src';
// @ts-ignore
import * as zh from '../dist/locale-data/zh.data.js';
PluralRules.__addLocaleData(zh as any);
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
