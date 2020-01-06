import '@formatjs/intl-pluralrules/polyfill-locales';
import {UnifiedNumberFormat} from '../src/core';
UnifiedNumberFormat.__addLocaleData(require('../dist/locale-data/zh.json'));
UnifiedNumberFormat.__addLocaleData(
  require('../dist/locale-data/zh-Hant.json')
);
UnifiedNumberFormat.__addLocaleData(
  require('../dist/locale-data/zh-Hans.json')
);
describe('notation-compact-zh-TW', function() {
  it('short', function() {
    const nfShort = new UnifiedNumberFormat('zh-TW', {
      notation: 'compact',
      compactDisplay: 'short',
    });
    expect(nfShort.format(987654321)).toBe('9.9億');
    expect(nfShort.format(98765432)).toBe('9877萬');
    expect(nfShort.format(98765)).toBe('9.9萬');
    expect(nfShort.format(9876)).toBe('9876');
    expect(nfShort.format(159)).toBe('159');
    expect(nfShort.format(15.9)).toBe('16');
    expect(nfShort.format(1.59)).toBe('1.6');
    expect(nfShort.format(0.159)).toBe('0.16');
    expect(nfShort.format(0.0159)).toBe('0.016');
    expect(nfShort.format(0.00159)).toBe('0.0016');
  });

  it('long', function() {
    const nfLong = new UnifiedNumberFormat('zh-TW', {
      notation: 'compact',
      compactDisplay: 'long',
    });
    expect(nfLong.format(987654321)).toBe('9.9億');
    expect(nfLong.format(98765432)).toBe('9877萬');
    expect(nfLong.format(98765)).toBe('9.9萬');
    expect(nfLong.format(9876)).toBe('9876');
    expect(nfLong.format(159)).toBe('159');
    expect(nfLong.format(15.9)).toBe('16');
    expect(nfLong.format(1.59)).toBe('1.6');
    expect(nfLong.format(0.159)).toBe('0.16');
    expect(nfLong.format(0.0159)).toBe('0.016');
    expect(nfLong.format(0.00159)).toBe('0.0016');
  });
});
