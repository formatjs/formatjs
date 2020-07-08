import '@formatjs/intl-getcanonicallocales/polyfill';
import ListFormat from '..';
// @ts-ignore
import * as en from '../tests-locale-data/en.json';
// @ts-ignore
import * as zh from '../tests-locale-data/zh.json';
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
