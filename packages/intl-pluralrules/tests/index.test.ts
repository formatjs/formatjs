import '@formatjs/intl-getcanonicallocales/polyfill'
import '@formatjs/intl-locale/polyfill.js'
import {PluralRules} from '../'
import {describe, expect, it} from 'vitest'
// @ts-ignore
import en from './locale-data/en.js'
import fr from './locale-data/fr.js'
PluralRules.__addLocaleData(en, fr)

describe('PluralRules', function () {
  it('default locale', function () {
    expect(new PluralRules().resolvedOptions()).toEqual({
      locale: 'en',
      maximumFractionDigits: 3,
      minimumFractionDigits: 0,
      minimumIntegerDigits: 1,
      pluralCategories: ['one', 'other'],
      type: 'cardinal',
    })
  })
  it('should work for cardinal', function () {
    expect(new PluralRules('en').select(0)).toBe('other')
    expect(new PluralRules('en').select(1)).toBe('one')
    expect(new PluralRules('en').select(2)).toBe('other')
    expect(new PluralRules('en').select(-1)).toBe('one')
    expect(new PluralRules('en').select(-2)).toBe('other')
  })
  it('should deal with en-XX', function () {
    expect(new PluralRules('en-XX').select(0)).toBe('other')
    expect(new PluralRules('en-XX').select(1)).toBe('one')
  })
  it('should deal with en-US', function () {
    expect(new PluralRules('en-US').select(0)).toBe('other')
    expect(new PluralRules('en-US').select(1)).toBe('one')
  })
  it('should not crash for fr', function () {
    expect(new PluralRules('fr').select(1000000)).toBe('many')
  })
  it('should work for ordinal', function () {
    expect(new PluralRules('en', {type: 'ordinal'}).select(0)).toBe('other')
    expect(new PluralRules('en', {type: 'ordinal'}).select(1)).toBe('one')
    expect(new PluralRules('en', {type: 'ordinal'}).select(2)).toBe('two')
    expect(new PluralRules('en', {type: 'ordinal'}).select(3)).toBe('few')
    expect(new PluralRules('en', {type: 'ordinal'}).select(-1)).toBe('one')
    expect(new PluralRules('en', {type: 'ordinal'}).select(-2)).toBe('two')
    expect(new PluralRules('en', {type: 'ordinal'}).select(-3)).toBe('few')
  })
  if ((PluralRules as any).polyfilled) {
    it('should honor minimumFractionDigits', function () {
      expect(
        new PluralRules('en', {minimumFractionDigits: 0} as any).select(1)
      ).toBe('one')
      expect(
        new PluralRules('en', {minimumFractionDigits: 2} as any).select(1)
      ).toBe('other')
    })
  }
})
