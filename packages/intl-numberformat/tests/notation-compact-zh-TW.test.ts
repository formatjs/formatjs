import '@formatjs/intl-getcanonicallocales/polyfill';
import '@formatjs/intl-pluralrules/polyfill-locales';
import {NumberFormat} from '../';
import * as zh from '../tests-locale-data/zh.json';
import * as zhHant from '../tests-locale-data/zh-Hant.json';
NumberFormat.__addLocaleData(zh as any, zhHant as any);

describe('notation-compact-zh-TW', function () {
  it('short', function () {
    const nfShort = new NumberFormat('zh-TW', {
      notation: 'compact',
      compactDisplay: 'short',
    });
    expect(nfShort.format(987654321)).toBe('9.9億');
    expect(nfShort.format(9876_5432)).toBe('9877萬');
    expect(nfShort.format(98765)).toBe('9.9萬');
    // NOTE: in Chrome 81 and Node 14, this is "9876", which kinda disrespect the grouping
    // separator setting. We think it is a bug.
    expect(nfShort.format(9876)).toBe('9876');
    expect(nfShort.format(159)).toBe('159');
    expect(nfShort.format(15.9)).toBe('16');
    expect(nfShort.format(1.59)).toBe('1.6');
    expect(nfShort.format(0.159)).toBe('0.16');
    expect(nfShort.format(0.0159)).toBe('0.016');
    expect(nfShort.format(0.00159)).toBe('0.0016');
  });

  it('long', function () {
    const nfLong = new NumberFormat('zh-TW', {
      notation: 'compact',
      compactDisplay: 'long',
    });
    expect(nfLong.format(987654321)).toBe('9.9億');
    expect(nfLong.format(98765432)).toBe('9877萬');
    expect(nfLong.format(98765)).toBe('9.9萬');
    // See the comment in the test case above.
    expect(nfLong.format(9876)).toBe('9876');
    expect(nfLong.format(159)).toBe('159');
    expect(nfLong.format(15.9)).toBe('16');
    expect(nfLong.format(1.59)).toBe('1.6');
    expect(nfLong.format(0.159)).toBe('0.16');
    expect(nfLong.format(0.0159)).toBe('0.016');
    expect(nfLong.format(0.00159)).toBe('0.0016');
  });
});
