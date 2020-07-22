import '@formatjs/intl-getcanonicallocales/polyfill';
import '@formatjs/intl-pluralrules/polyfill-locales';
import * as zh from './locale-data/zh.json';
import * as zhHant from './locale-data/zh-Hant.json';
import * as zhHans from './locale-data/zh-Hans.json';
import * as en from './locale-data/en.json';
import * as enAI from './locale-data/en-AI.json';
import RelativeTimeFormat from '..';
RelativeTimeFormat.__addLocaleData(en, enAI, zh, zhHans, zhHant);

describe('Intl.RelativeTimeFormat', function () {
  it('should lookup zh-CN', function () {
    expect(new RelativeTimeFormat('zh-CN').format(-1, 'second')).toBe(
      '1秒钟前'
    );
  });
  it('should lookup zh-TW', function () {
    expect(new RelativeTimeFormat('zh-TW').format(-1, 'second')).toBe('1 秒前');
    expect(
      new RelativeTimeFormat('zh-TW', {
        style: 'short',
        numeric: 'auto',
      }).format(-1, 'seconds')
    ).toBe('1 秒前');
  });
  it('should resolve parent correctly', function () {
    expect(new RelativeTimeFormat('en-AI').format(-1, 'second')).toBe(
      '1 second ago'
    );
  });
});
