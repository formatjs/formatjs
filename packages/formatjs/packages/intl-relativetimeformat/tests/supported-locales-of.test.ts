import 'intl-pluralrules';
import '../src/polyfill';
import '../polyfill';
import '../dist/locale-data/zh';

describe('supportedLocalesOf', function() {
  it('should return correct locales that we only have data for', function() {
    expect(
      Intl.RelativeTimeFormat.supportedLocalesOf(['zh', 'en-jj'], undefined)
    ).toEqual(['zh', 'en']);
    expect(
      Intl.RelativeTimeFormat.supportedLocalesOf(['fr'], undefined)
    ).toEqual([]);
  });
});
