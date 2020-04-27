import '../src/polyfill';
import '../polyfill';
import '../dist/locale-data/zh';

describe('supportedLocalesOf', function() {
  function test() {
    expect(Intl.PluralRules.supportedLocalesOf(['zh', 'en-jj'])).toContain(
      'zh'
    );
    expect(Intl.PluralRules.supportedLocalesOf(['fr'])).toEqual([]);
  }

  if ((Intl.PluralRules as any).polyfilled) {
    it('should return correct locales that we only have data for', test);
  } else {
    it.skip('should return correct locales that we only have data for', test);
  }
});
