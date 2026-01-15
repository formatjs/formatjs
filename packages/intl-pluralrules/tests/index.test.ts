import '@formatjs/intl-getcanonicallocales/polyfill.js'
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

  describe('bigint and huge numbers', function () {
    it('should handle bigint values', function () {
      // Cardinal rules with bigint
      expect(new PluralRules('en').select(0n)).toBe('other')
      expect(new PluralRules('en').select(1n)).toBe('one')
      expect(new PluralRules('en').select(2n)).toBe('other')
      expect(new PluralRules('en').select(1000000n)).toBe('other')
    })

    it('should handle bigint ordinals', function () {
      // Ordinal rules with bigint
      expect(new PluralRules('en', {type: 'ordinal'}).select(1n)).toBe('one')
      expect(new PluralRules('en', {type: 'ordinal'}).select(2n)).toBe('two')
      expect(new PluralRules('en', {type: 'ordinal'}).select(3n)).toBe('few')
      expect(new PluralRules('en', {type: 'ordinal'}).select(11n)).toBe('other')
      expect(new PluralRules('en', {type: 'ordinal'}).select(21n)).toBe('one')
      expect(new PluralRules('en', {type: 'ordinal'}).select(22n)).toBe('two')
      expect(new PluralRules('en', {type: 'ordinal'}).select(23n)).toBe('few')
      expect(new PluralRules('en', {type: 'ordinal'}).select(101n)).toBe('one')
      expect(new PluralRules('en', {type: 'ordinal'}).select(102n)).toBe('two')
      expect(new PluralRules('en', {type: 'ordinal'}).select(103n)).toBe('few')
    })

    it('should handle very large bigint values', function () {
      // Test with large numbers beyond Number.MAX_SAFE_INTEGER (9007199254740991)
      const huge = 10000000000000n // 10 trillion
      expect(new PluralRules('en').select(huge)).toBe('other')

      // Test modulo operations still work with large numbers
      expect(new PluralRules('en', {type: 'ordinal'}).select(huge + 1n)).toBe(
        'one'
      )
      expect(new PluralRules('en', {type: 'ordinal'}).select(huge + 2n)).toBe(
        'two'
      )
      expect(new PluralRules('en', {type: 'ordinal'}).select(huge + 3n)).toBe(
        'few'
      )
      expect(new PluralRules('en', {type: 'ordinal'}).select(huge + 11n)).toBe(
        'other'
      )
    })

    it('should handle huge number strings', function () {
      // Test ordinal with large number strings
      expect(
        new PluralRules('en', {type: 'ordinal'}).select('10000000001' as any)
      ).toBe('one')
      expect(
        new PluralRules('en', {type: 'ordinal'}).select('10000000002' as any)
      ).toBe('two')
      expect(
        new PluralRules('en', {type: 'ordinal'}).select('10000000003' as any)
      ).toBe('few')
    })

    it('should handle huge numbers with French million rules', function () {
      // French has special rules for millions: n % 1000000 = 0
      expect(new PluralRules('fr').select(1000000n)).toBe('many')
      expect(new PluralRules('fr').select(2000000n)).toBe('many')
      expect(new PluralRules('fr').select(1000000000n)).toBe('many')
      expect(new PluralRules('fr').select(1000001n)).toBe('other')
    })

    it('should handle negative bigint values', function () {
      expect(new PluralRules('en').select(-1n)).toBe('one')
      expect(new PluralRules('en').select(-2n)).toBe('other')
      expect(new PluralRules('en').select(-1000000n)).toBe('other')
    })

    it('should handle numbers near MAX_SAFE_INTEGER', function () {
      const maxSafe = Number.MAX_SAFE_INTEGER // 9007199254740991
      expect(new PluralRules('en').select(maxSafe)).toBe('other')
      expect(new PluralRules('en').select(maxSafe - 1)).toBe('other')

      // Test ordinal rules still work correctly
      expect(new PluralRules('en', {type: 'ordinal'}).select(maxSafe)).toBe(
        'one'
      ) // ends in 1
      expect(new PluralRules('en', {type: 'ordinal'}).select(maxSafe - 1)).toBe(
        'other'
      ) // ends in 0
    })

    it('should handle Infinity', function () {
      expect(new PluralRules('en').select(Infinity)).toBe('other')
      expect(new PluralRules('en').select(-Infinity)).toBe('other')
    })

    it('should handle very large decimals', function () {
      // Large numbers with decimal parts
      expect(new PluralRules('en').select(1000000.5)).toBe('other')
      expect(new PluralRules('en').select(1000000000000.5)).toBe('other')
    })
  })

  describe.skip('compact notation with c/e operand (future feature)', function () {
    // Tests for compact decimal notation plural rules
    // Based on: https://docs.google.com/document/d/1Wx9Drhpl9p2ZqVZMGQ7KUF4pUfPtuJupv8oQ_Gf6sEE
    // Note: c and e are synonyms - both represent the exponent
    // These tests document expected behavior when compact notation is implemented

    it('should handle French million with compact notation', function () {
      // French: i = 1 and c/e = 6 (1 million) → many
      // Input format: "1c6" or "1e6" - both have exponent 6
      // Currently c/e are always 0, so this will fail until compact notation is implemented
      expect(new PluralRules('fr').select('1c6' as any)).toBe('many')
      expect(new PluralRules('fr').select('1e6' as any)).toBe('many')

      // French: i = 1.2 and c/e = 6 (1.2 million) → many (c ∉ [0,5])
      expect(new PluralRules('fr').select('1.2c6' as any)).toBe('many')
      expect(new PluralRules('fr').select('1.2e6' as any)).toBe('many')

      // French: i = 234.5 and c/e = 6 (234.5 million) → many
      expect(new PluralRules('fr').select('234.5c6' as any)).toBe('many')
      expect(new PluralRules('fr').select('234.5e6' as any)).toBe('many')
    })

    it('should distinguish compact vs non-compact for French', function () {
      // Regular number: 1,200,000 (no exponent, c/e=0) → other
      expect(new PluralRules('fr').select(1200000)).toBe('other')

      // Compact: 1.2 million (c/e=6) → many
      expect(new PluralRules('fr').select('1.2c6' as any)).toBe('many')
      expect(new PluralRules('fr').select('1.2e6' as any)).toBe('many')
    })

    it('should handle French thousand with compact notation', function () {
      // French: i = 1 and c/e = 3 (1 thousand) → other (c ∈ [0,5])
      expect(new PluralRules('fr').select('1c3' as any)).toBe('other')
      expect(new PluralRules('fr').select('1e3' as any)).toBe('other')

      // French: i = 1.2 and c/e = 3 (1.2 thousand) → other (c ∈ [0,5])
      expect(new PluralRules('fr').select('1.2c3' as any)).toBe('other')
      expect(new PluralRules('fr').select('1.2e3' as any)).toBe('other')
    })

    it('should handle exact millions without compact notation', function () {
      // French: i = 1,000,000 (divisible by 1M, no exponent, c/e=0) → many
      // This already works with current implementation
      expect(new PluralRules('fr').select(1000000)).toBe('many')
      expect(new PluralRules('fr').select(2000000)).toBe('many')

      // But 1,284,043 (not divisible by 1M) → other
      expect(new PluralRules('fr').select(1284043)).toBe('other')
    })
  })
})
