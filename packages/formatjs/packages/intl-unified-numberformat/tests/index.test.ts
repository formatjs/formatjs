import '@formatjs/intl-pluralrules/polyfill-locales';
import {UnifiedNumberFormat} from '../src/core';
UnifiedNumberFormat.__addLocaleData(require('../dist/locale-data/zh.json'));
UnifiedNumberFormat.__addLocaleData(require('../dist/locale-data/en.json'));

function test() {
  it('should work', function() {
    expect(
      new UnifiedNumberFormat('zh', {
        style: 'unit',
        unit: 'bit',
      }).format(1000)
    ).toBe('1,000比特');
    expect(
      new UnifiedNumberFormat('en', {
        style: 'unit',
        unit: 'bit',
      }).format(1000)
    ).toBe('1,000 bit');
  });
  it('should lookup locale correctly', function() {
    expect(
      new UnifiedNumberFormat('en-BS', {
        style: 'unit',
        unit: 'bit',
      }).format(1000)
    ).toBe('1,000 bit');
    expect(
      new UnifiedNumberFormat('en-BS', {
        style: 'unit',
        unit: 'celsius',
      }).format(1000)
    ).toBe('1,000°C');
    expect(
      new UnifiedNumberFormat('en-BS', {
        style: 'unit',
        unit: 'gallon',
      }).format(1000)
    ).toBe('1,000 gal US');
  });
  it('supportedLocalesOf should return correct result based on data loaded', function() {
    expect(
      UnifiedNumberFormat.supportedLocalesOf(['zh', 'en-US', 'af'])
    ).toEqual(['zh', 'en-US']);
    expect(UnifiedNumberFormat.supportedLocalesOf(['af'])).toEqual([]);
  });
  it('should not crash if unit is not specified', function() {
    expect(new UnifiedNumberFormat().resolvedOptions().unit).toBeUndefined();
  });
  it('formatToParts should work', function() {
    expect(
      new UnifiedNumberFormat('zh', {
        style: 'unit',
        unit: 'bit',
      }).formatToParts(1000)
    ).toEqual([
      {type: 'integer', value: '1'},
      {type: 'group', value: ','},
      {type: 'integer', value: '000'},
      {type: 'unit', value: '比特'},
    ]);
    expect(
      new UnifiedNumberFormat('en', {
        style: 'unit',
        unit: 'bit',
      }).formatToParts(1000)
    ).toEqual([
      {type: 'integer', value: '1'},
      {type: 'group', value: ','},
      {type: 'integer', value: '000'},
      {type: 'literal', value: ' '},
      {type: 'unit', value: 'bit'},
    ]);
  });
  it("supports currencyDisplay: 'narrowSymbol'", () => {
    expect(
      new UnifiedNumberFormat('zh-CN', {
        style: 'currency',
        currency: 'AUD',
        currencyDisplay: 'narrowSymbol',
      }).format(-1000)
    ).toEqual('-$1,000.00');
    expect(
      new UnifiedNumberFormat('zh-CN', {
        style: 'currency',
        currency: 'AUD',
        currencyDisplay: 'narrowSymbol',
      }).formatToParts(-1000)
    ).toEqual([
      {type: 'minusSign', value: '-'},
      {type: 'currency', value: '$'},
      {type: 'integer', value: '1'},
      {type: 'group', value: ','},
      {type: 'integer', value: '000'},
      {type: 'decimal', value: '.'},
      {type: 'fraction', value: '00'},
    ]);
    // Fallback to ISO currency code if narrowSymbol is not available.
    expect(
      new UnifiedNumberFormat('zh-CN', {
        style: 'currency',
        currency: 'ZWD',
        currencyDisplay: 'narrowSymbol',
      }).format(-1000)
    ).toEqual('-ZWD 1,000');
  });
}

// Node v8 does not have formatToParts and v12 has native NumberFormat.
if (process.version.startsWith('v10')) {
  describe('UnifiedNumberFormat', test);
} else {
  describe.skip('UnifiedNumberFormat', test);
}
