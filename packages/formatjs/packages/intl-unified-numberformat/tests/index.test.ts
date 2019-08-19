import 'intl-pluralrules'
import UnifiedNumberFormat from '../src/units';
UnifiedNumberFormat.__addUnitLocaleData(require('../dist/locale-data/zh'));

UnifiedNumberFormat.__addUnitLocaleData(require('../dist/locale-data/en'));

describe('UnifiedNumberFormat', function() {
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
      UnifiedNumberFormat.supportedLocalesOf(['zh', 'en-us', 'af'])
    ).toEqual(['zh', 'en']);
    expect(UnifiedNumberFormat.supportedLocalesOf(['af'])).toEqual([]);
  });
  it.skip('formatToParts should work', function() {
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
    ).toEqual('1,000 bit');
  });
});
