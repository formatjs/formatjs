import '@formatjs/intl-getcanonicallocales/polyfill';
import '../src/polyfill';
import '../dist/locale-data/zh';

describe('supportedLocalesOf', function () {
  function test() {
    expect(Intl.PluralRules.supportedLocalesOf(['zh', 'en-jj'])).toContain(
      'zh'
    );
    // FIXME: Only run this in Node since in browsers other tests populate Intl.PluralRules :(
    if (process.version) {
      expect(Intl.PluralRules.supportedLocalesOf(['fr'])).toEqual([]);
    }
  }

  if ((Intl.PluralRules as any).polyfilled) {
    it('should return correct locales that we only have data for', test);
  } else {
    xit('should return correct locales that we only have data for', test);
  }
});
