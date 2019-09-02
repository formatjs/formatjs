import '@formatjs/intl-pluralrules/polyfill-locales';
import '../src/polyfill';
import {UnifiedNumberFormat} from '../src/core';
if (typeof (Intl.NumberFormat as any).__addUnitLocaleData === 'function') {
  (Intl.NumberFormat as any).__addUnitLocaleData(
    require('../dist/locale-data/zh')
  );
}

const NumberFormat = (Intl.NumberFormat as any) as typeof UnifiedNumberFormat;

describe('UnifiedNumberFormat', function() {
  it('should work', function() {
    expect(
      new NumberFormat('zh', {
        style: 'unit',
        unit: 'bit',
      }).format(1000)
    ).toBe('1,000比特');
    expect(
      new NumberFormat('en', {
        style: 'unit',
        unit: 'bit',
      }).format(1000)
    ).toBe('1,000 bit');
  });
  it('should lookup locale correctly', function() {
    expect(
      new NumberFormat('en-BS', {
        style: 'unit',
        unit: 'bit',
      }).format(1000)
    ).toBe('1,000 bit');
    expect(
      new NumberFormat('en-BS', {
        style: 'unit',
        unit: 'celsius',
      }).format(1000)
    ).toBe('1,000°C');
    expect(
      new NumberFormat('en-BS', {
        style: 'unit',
        unit: 'gallon',
      }).format(1000)
    ).toBe('1,000 gal US');
  });
  it('supportedLocalesOf should return correct result based on data loaded', function() {
    expect(NumberFormat.supportedLocalesOf(['zh', 'en-us', 'af'])).toEqual([
      'zh',
      'en',
    ]);
    expect(NumberFormat.supportedLocalesOf(['af'])).toEqual([]);
  });
  it.skip('formatToParts should work', function() {
    expect(
      new NumberFormat('zh', {
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
      new NumberFormat('en', {
        style: 'unit',
        unit: 'bit',
      }).formatToParts(1000)
    ).toEqual('1,000 bit');
  });
});
