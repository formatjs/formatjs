import '../src/polyfill';
import '../polyfill';
import '../dist/locale-data/en';

describe('Intl.PluralRules', function() {
  it('should work for cardinal', function() {
    expect(new Intl.PluralRules('en').select(0)).toBe('other');
    expect(new Intl.PluralRules('en').select(1)).toBe('one');
    expect(new Intl.PluralRules('en').select(2)).toBe('other');
    expect(new Intl.PluralRules('en').select(-1)).toBe('one');
    expect(new Intl.PluralRules('en').select(-2)).toBe('other');
  });
  it('should deal with en-XX', function() {
    expect(new Intl.PluralRules('en-XX').select(0)).toBe('other');
    expect(new Intl.PluralRules('en-XX').select(1)).toBe('one');
  });
  it('should work for ordinal', function() {
    expect(new Intl.PluralRules('en', {type: 'ordinal'}).select(0)).toBe(
      'other'
    );
    expect(new Intl.PluralRules('en', {type: 'ordinal'}).select(1)).toBe('one');
    expect(new Intl.PluralRules('en', {type: 'ordinal'}).select(2)).toBe('two');
    expect(new Intl.PluralRules('en', {type: 'ordinal'}).select(3)).toBe('few');
    expect(new Intl.PluralRules('en', {type: 'ordinal'}).select(-1)).toBe(
      'one'
    );
    expect(new Intl.PluralRules('en', {type: 'ordinal'}).select(-2)).toBe(
      'two'
    );
    expect(new Intl.PluralRules('en', {type: 'ordinal'}).select(-3)).toBe(
      'few'
    );
  });
  if ((Intl.PluralRules as any).polyfilled) {
    it('should honor minimumFractionDigits', function() {
      expect(
        new Intl.PluralRules('en', {minimumFractionDigits: 0} as any).select(1)
      ).toBe('one');
      expect(
        new Intl.PluralRules('en', {minimumFractionDigits: 2} as any).select(1)
      ).toBe('other');
    });
  }
});
