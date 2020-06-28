import '@formatjs/intl-getcanonicallocales/polyfill';
console.log('----', __dirname);
import {PluralRules} from '../';
// @ts-ignore
import * as en from '../tests-locale-data/en.js';
PluralRules.__addLocaleData(en.default || en);

describe('PluralRules', function () {
  it('should work for cardinal', function () {
    expect(new PluralRules('en').select(0)).toBe('other');
    expect(new PluralRules('en').select(1)).toBe('one');
    expect(new PluralRules('en').select(2)).toBe('other');
    expect(new PluralRules('en').select(-1)).toBe('one');
    expect(new PluralRules('en').select(-2)).toBe('other');
  });
  it('should deal with en-XX', function () {
    expect(new PluralRules('en-XX').select(0)).toBe('other');
    expect(new PluralRules('en-XX').select(1)).toBe('one');
  });
  it('should work for ordinal', function () {
    expect(new PluralRules('en', {type: 'ordinal'}).select(0)).toBe('other');
    expect(new PluralRules('en', {type: 'ordinal'}).select(1)).toBe('one');
    expect(new PluralRules('en', {type: 'ordinal'}).select(2)).toBe('two');
    expect(new PluralRules('en', {type: 'ordinal'}).select(3)).toBe('few');
    expect(new PluralRules('en', {type: 'ordinal'}).select(-1)).toBe('one');
    expect(new PluralRules('en', {type: 'ordinal'}).select(-2)).toBe('two');
    expect(new PluralRules('en', {type: 'ordinal'}).select(-3)).toBe('few');
  });
  if ((PluralRules as any).polyfilled) {
    it('should honor minimumFractionDigits', function () {
      expect(
        new PluralRules('en', {minimumFractionDigits: 0} as any).select(1)
      ).toBe('one');
      expect(
        new PluralRules('en', {minimumFractionDigits: 2} as any).select(1)
      ).toBe('other');
    });
  }
});
