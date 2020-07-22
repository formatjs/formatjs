import '@formatjs/intl-getcanonicallocales/polyfill';
import '@formatjs/intl-pluralrules/polyfill-locales';
import * as zh from './locale-data/zh.json';
import * as zhHant from './locale-data/zh-Hant.json';
import * as zhHans from './locale-data/zh-Hans.json';
import * as en from './locale-data/en.json';
import * as enAI from './locale-data/en-AI.json';
import RelativeTimeFormat from '..';
RelativeTimeFormat.__addLocaleData(en, enAI, zh, zhHans, zhHant);

describe('supportedLocalesOf', function () {
  function test() {
    expect(RelativeTimeFormat.supportedLocalesOf(['zh', 'en-jj'])).toContain(
      'zh'
    );
  }
  if (RelativeTimeFormat.polyfilled) {
    it('should return correct locales that we only have data for', test);
  } else {
    xit('should return correct locales that we only have data for', test);
  }
});
