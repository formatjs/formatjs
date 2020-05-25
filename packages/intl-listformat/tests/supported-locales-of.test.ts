import '@formatjs/intl-getcanonicallocales/polyfill';
import ListFormat from '../src';
// @ts-ignore
import * as en from '../dist/locale-data/en.json';
// @ts-ignore
import * as zh from '../dist/locale-data/zh.json';
ListFormat.__addLocaleData(en, zh);

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
