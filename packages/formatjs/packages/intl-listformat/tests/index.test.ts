import '../src/polyfill';
import '../polyfill';
import '../dist/locale-data/zh';
import '../dist/locale-data/en';

describe('Intl.ListFormat', function() {
  const ListFormat = (Intl as any).ListFormat;
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
    expect(new ListFormat('en-AI').format(['1', '2', '3'])).toBe('1, 2, and 3');
  });
});
