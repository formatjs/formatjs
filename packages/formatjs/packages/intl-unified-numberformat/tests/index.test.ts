import UnifiedNumberFormat from '../src/units';
import {Unit} from '../src/units-constants';
UnifiedNumberFormat.__addUnitLocaleData(
  'bit' as Unit,
  ...require('../dist/locale-data/digital-bit/zh')
);
UnifiedNumberFormat.__addUnitLocaleData(
  'bit' as Unit,
  ...require('../dist/locale-data/digital-bit/en')
);

describe('UnifiedNumberFormat', function() {
  it('should work', function() {
    expect(
      new UnifiedNumberFormat('zh', {
        style: 'unit',
        unit: 'bit' as Unit,
      }).format(1000)
    ).toBe('1,000比特');
    expect(
      new UnifiedNumberFormat('en', {
        style: 'unit',
        unit: 'bit' as Unit,
      }).format(1000)
    ).toBe('1,000 bit');
  });
});
