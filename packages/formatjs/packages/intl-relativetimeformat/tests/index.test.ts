import 'intl-pluralrules';
import '../src/polyfill-locales';

describe('Intl.RelativeTimeFormat', function() {
  it('should support aliases', function() {
    expect(
      new Intl.RelativeTimeFormat('zh-CN', undefined).resolvedOptions().locale
    ).toBe('zh-Hans');
    expect(
      new Intl.RelativeTimeFormat('zh-TW', undefined).resolvedOptions().locale
    ).toBe('zh-Hant');
  });
});
