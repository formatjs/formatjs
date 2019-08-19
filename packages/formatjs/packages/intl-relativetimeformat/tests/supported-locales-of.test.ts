import 'intl-pluralrules';
import '../src/polyfill';
import '../polyfill';
import '../dist/locale-data/zh';

describe('supportedLocalesOf', function() {
  function test() {
    expect(
      Intl.RelativeTimeFormat.supportedLocalesOf(['zh', 'en-jj'], undefined)
    ).toContain('zh');
    expect(
      Intl.RelativeTimeFormat.supportedLocalesOf(['fr'], undefined)
    ).toEqual([]);
  }
  if (Intl.RelativeTimeFormat.polyfilled) {
    it.skip('should return correct locales that we only have data for', test);
  } else {
    it('should return correct locales that we only have data for', test);
  }
});
