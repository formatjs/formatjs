import 'intl-pluralrules';
import '../src/polyfill';
import '../polyfill';
import '../dist/locale-data/zh';

describe('supportedLocalesOf', function() {
  if (Intl.RelativeTimeFormat.polyfilled) {
    it('should return correct locales that we only have data for', function() {
      expect(
        Intl.RelativeTimeFormat.supportedLocalesOf(['zh', 'en-jj'], undefined)
      ).toContain('zh');
      expect(
        Intl.RelativeTimeFormat.supportedLocalesOf(['fr'], undefined)
      ).toEqual([]);
    });
  }
});
