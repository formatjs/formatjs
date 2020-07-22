import '@formatjs/intl-getcanonicallocales/polyfill';
import ListFormat from '..';
import * as en from './locale-data/en.json';
import * as enUS from './locale-data/en-US-POSIX.json';
import * as enAI from './locale-data/en-AI.json';
import * as zh from './locale-data/zh.json';
import * as zhHant from './locale-data/zh-Hant.json';
import * as zhHans from './locale-data/zh-Hans.json';
ListFormat.__addLocaleData(en, enUS, enAI, zh, zhHans, zhHant);

describe('supportedLocalesOf', function () {
  function test() {
    expect(ListFormat.supportedLocalesOf(['zh', 'en-jj'])).toContain('zh');
    expect(ListFormat.supportedLocalesOf('fr')).toEqual([]);
  }
  if (ListFormat.polyfilled) {
    it('should return correct locales that we only have data for', test);
  } else {
    xit('should return correct locales that we only have data for', test);
  }
});
