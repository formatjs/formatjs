import '@formatjs/intl-pluralrules/polyfill-locales';
import '../src/polyfill';
import '../polyfill';
import '../dist/locale-data/zh';
import '../dist/locale-data/en';

describe('Intl.RelativeTimeFormat', function() {
  const RelativeTimeFormat = (Intl as any).RelativeTimeFormat;
  it('should lookup zh-CN', function() {
    expect(new RelativeTimeFormat('zh-CN').format(-1, 'second')).toBe(
      '1秒钟前'
    );
  });
  it('should lookup zh-TW', function() {
    expect(new RelativeTimeFormat('zh-TW').format(-1, 'second')).toBe('1 秒前');
  });
  it('should resolve parent correctly', function() {
    expect(new RelativeTimeFormat('en-AI').format(-1, 'second')).toBe(
      '1 second ago'
    );
  });
});
