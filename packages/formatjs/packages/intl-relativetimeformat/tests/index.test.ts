import '@formatjs/intl-pluralrules/polyfill-locales';
import '../src/polyfill';
import '../polyfill';
import '../dist/locale-data/zh';
import '../dist/locale-data/en';

describe('Intl.RelativeTimeFormat', function() {
  it('should support aliases', function() {
    expect(
      new Intl.RelativeTimeFormat('zh-CN', undefined).format(-1, 'second')
    ).toBe('1秒钟前');
    expect(
      new Intl.RelativeTimeFormat('zh-TW', undefined).format(-1, 'second')
    ).toBe('1 秒前');
  });
  it('should resolve parent correctly', function() {
    expect(
      new Intl.RelativeTimeFormat('en-AI', undefined).format(-1, 'second')
    ).toBe('1 second ago');
  });
});
