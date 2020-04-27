import '../src/polyfill';
import '../polyfill';
import '../dist/locale-data/zh';
import '../dist/locale-data/en';
import PolyfilledListFormat from '../src/core';

describe('Intl.ListFormat', function() {
  const ListFormat: typeof PolyfilledListFormat = (Intl as any).ListFormat;
  it('should support aliases', function() {
    expect(
      new ListFormat('zh-CN', {type: 'unit'}).format(['1', '2', '3'])
    ).toBe('123');
    expect(new ListFormat('zh-CN', {type: 'unit'}).format(['1', '2'])).toBe(
      '12'
    );
    expect(
      new ListFormat('zh-TW', {type: 'unit'}).format(['1', '2', '3'])
    ).toBe('1 2 3');
    expect(new ListFormat('zh-TW', {type: 'unit'}).format(['1', '2'])).toBe(
      '1 2'
    );
  });
  it('should resolve parent correctly', function() {
    expect(new ListFormat('en-AI').format(['1', '2'])).toBe('1 and 2');
    // Node 12 has an old version of CLDR
    if (process.version.startsWith('v10')) {
      expect(new ListFormat('en-AI').format(['1', '2', '3'])).toBe(
        '1, 2 and 3'
      );
    }
  });
  it('should normalize case correctly', function() {
    const lf = new ListFormat('en-us', {style: 'short', type: 'unit'});
    expect(lf.resolvedOptions()).toEqual({
      locale: 'en-US',
      type: 'unit',
      style: 'short',
    });
  });
});
