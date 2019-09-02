import '../src/polyfill';
import '../polyfill';
import '../dist/locale-data/en';

describe('Intl.PluralRules', function() {
  it('should work for cardinal', function() {
    expect(new Intl.PluralRules().select(0)).toBe('other');
    expect(new Intl.PluralRules().select(1)).toBe('one');
    expect(new Intl.PluralRules().select(2)).toBe('other');
  });
  it('should work for ordinal', function() {
    expect(new Intl.PluralRules(undefined, {type: 'ordinal'}).select(0)).toBe(
      'other'
    );
    expect(new Intl.PluralRules(undefined, {type: 'ordinal'}).select(1)).toBe(
      'one'
    );
    expect(new Intl.PluralRules(undefined, {type: 'ordinal'}).select(2)).toBe(
      'two'
    );
    expect(new Intl.PluralRules(undefined, {type: 'ordinal'}).select(3)).toBe(
      'few'
    );
  });
});
