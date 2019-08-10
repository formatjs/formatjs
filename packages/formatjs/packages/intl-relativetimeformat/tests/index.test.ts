import 'intl-pluralrules';
import '../src/polyfill-locales';

describe('Intl.RelativeTimeFormat', function() {
  it('should support aliases', function() {
    expect(
      new Intl.RelativeTimeFormat('zh-CN', undefined).format(-1, 'second')
    ).toBe('1秒钟前');
    expect(
      new Intl.RelativeTimeFormat('zh-TW', undefined).format(-1, 'second')
    ).toBe('1 秒前');
  });
});
