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

  describe('selectRange', function () {
    it('should return plural category for range', function () {
      const pr = new PluralRules('en')
      // English: 1-2 → "other" (ranges default to end category or lookup table)
      expect(pr.selectRange(1, 2)).toBe('other')
      expect(pr.selectRange(0, 1)).toBe('other')
      expect(pr.selectRange(2, 5)).toBe('other')
    })

    it('should return same category when start equals end', function () {
      const pr = new PluralRules('en')
      // When formatted strings are equal, return that category
      expect(pr.selectRange(1, 1)).toBe('one')
      expect(pr.selectRange(2, 2)).toBe('other')
      expect(pr.selectRange(0, 0)).toBe('other')
    })

    it('should handle French plural ranges', function () {
      const pr = new PluralRules('fr')
      // French: "one" to "one" → "one"
      expect(pr.selectRange(0, 0)).toBe('one')
      expect(pr.selectRange(1, 1)).toBe('one')
      // French: "one" to "other" → "other"
      expect(pr.selectRange(0, 2)).toBe('other')
      expect(pr.selectRange(1, 2)).toBe('other')
      // French: "other" to "other" → "other"
      expect(pr.selectRange(2, 3)).toBe('other')
    })

    it('should throw TypeError for undefined arguments', function () {
      const pr = new PluralRules('en')
      expect(() => pr.selectRange(undefined as any, 5)).toThrow(TypeError)
      expect(() => pr.selectRange(1, undefined as any)).toThrow(TypeError)
      expect(() => pr.selectRange(undefined as any, undefined as any)).toThrow(
        TypeError
      )
    })

    it('should throw RangeError for non-finite values', function () {
      const pr = new PluralRules('en')
      expect(() => pr.selectRange(Infinity, 5)).toThrow(RangeError)
      expect(() => pr.selectRange(1, Infinity)).toThrow(RangeError)
      expect(() => pr.selectRange(NaN, 5)).toThrow(RangeError)
      expect(() => pr.selectRange(1, NaN)).toThrow(RangeError)
    })

    it('should handle bigint values', function () {
      // Note: Chrome's native implementation (as of early 2025) has a bug where it doesn't
      // properly handle BigInt for selectRange, throwing "Cannot convert a BigInt value to a number".
      // This is a Chrome bug - the ECMA-402 spec requires BigInt support via ToIntlMathematicalValue.
      // Our polyfill correctly handles BigInt as specified.
      const pr = new PluralRules('en')
      expect(pr.selectRange(BigInt(1), BigInt(2))).toBe('other')
      expect(pr.selectRange(BigInt(0), BigInt(1))).toBe('other')
      expect(pr.selectRange(BigInt(1), BigInt(1))).toBe('one')
    })

    it('should handle ordinal ranges', function () {
      const pr = new PluralRules('en', {type: 'ordinal'})
      // English ordinals: 1st, 2nd, 3rd, etc.
      expect(pr.selectRange(1, 2)).toBeDefined()
      expect(pr.selectRange(1, 1)).toBe('one')
      expect(pr.selectRange(2, 2)).toBe('two')
      expect(pr.selectRange(3, 3)).toBe('few')
    })
  })

  describe('compact notation with c/e operand', function () {
    // Tests for compact decimal notation plural rules
    // Based on: https://docs.google.com/document/d/1Wx9Drhpl9p2ZqVZMGQ7KUF4pUfPtuJupv8oQ_Gf6sEE
    // Note: c and e are synonyms - both represent the exponent
    // The c/e operand is calculated from compact notation formatting

    it('should handle French million with compact notation', function () {
      const pr = new PluralRules('fr', {notation: 'compact'})

      // French rule: e = 0 and i != 0 and i % 1000000 = 0 and v = 0 or e != 0..5
      // Note: Without NumberFormat locale data, falls back to standard behavior (e=0)
      // With NumberFormat data: For millions (exponent=6), e != 0..5 applies → many
      // Without NumberFormat data: Falls back to standard rules
      expect(pr.select(1000000)).toBe('many') // 1M divisible by 1M, v=0 → many (standard)
      expect(pr.select(1200000)).toBe('other') // 1.2M not divisible by 1M → other (fallback)
      expect(pr.select(234500000)).toBe('other') // 234.5M not divisible by 1M → other (fallback)
    })

    it('should distinguish compact vs non-compact for French', function () {
      // Standard notation: no compact exponent (c/e=0)
      const prStandard = new PluralRules('fr')
      // 1,000,000 is divisible by 1M with v=0 → many (first part of rule)
      expect(prStandard.select(1000000)).toBe('many')
      // 1,200,000 is NOT divisible by 1M → other
      expect(prStandard.select(1200000)).toBe('other')

      // Compact notation: with compact exponent (c/e=6 for millions)
      // Note: These tests would pass only if NumberFormat locale data is loaded
      const prCompact = new PluralRules('fr', {notation: 'compact'})
      // Without NumberFormat data, falls back to standard behavior (exponent=0)
      expect(prCompact.select(1200000)).toBe('other') // fallback to standard
    })

    it('should handle French thousand with compact notation', function () {
      const pr = new PluralRules('fr', {notation: 'compact'})

      // French rule: e != 0..5 means e must be >= 6 for "many"
      // Note: Without NumberFormat data, falls back to e=0 (standard behavior)
      expect(pr.select(1000)).toBe('other') // Not divisible by 1M → other
      expect(pr.select(1200)).toBe('other') // Not divisible by 1M → other
    })

    it('should handle exact millions without compact notation', function () {
      const pr = new PluralRules('fr') // No compact notation

      // French: i = 1,000,000 (divisible by 1M, no exponent, c/e=0) → many
      // Rule: e = 0 and i != 0 and i % 1000000 = 0 and v = 0
      expect(pr.select(1000000)).toBe('many')
      expect(pr.select(2000000)).toBe('many')

      // But 1,284,043 (not divisible by 1M) → other
      expect(pr.select(1284043)).toBe('other')
    })

    it('should work with all compact-requiring locales', function () {
      // Test each of the 9 locales that use c/e operands
      const locales = [
        'ca',
        'es',
        'fr',
        'it',
        'lld',
        'pt',
        'pt-PT',
        'scn',
        'vec',
      ]

      for (const locale of locales) {
        const pr = new PluralRules(locale, {notation: 'compact'})
        // Basic smoke test - should not throw (will fall back to standard if no NumberFormat data)
        expect(() => pr.select(1000000)).not.toThrow()
        expect(() => pr.select(1200)).not.toThrow()
        // Should return valid plural categories
        const result1 = pr.select(1000000)
        const result2 = pr.select(1200)
        expect(['zero', 'one', 'two', 'few', 'many', 'other']).toContain(
          result1
        )
        expect(['zero', 'one', 'two', 'few', 'many', 'other']).toContain(
          result2
        )
      }
    })

    it('should default to standard notation (c/e=0)', function () {
      const pr = new PluralRules('fr') // No notation option
      // Should behave identically to {notation: 'standard'}
      const prStandard = new PluralRules('fr', {notation: 'standard'})

      expect(pr.select(1000000)).toBe(prStandard.select(1000000))
      expect(pr.select(1200)).toBe(prStandard.select(1200))
    })

    it('should accept compactDisplay option', function () {
      const prShort = new PluralRules('fr', {
        notation: 'compact',
        compactDisplay: 'short',
      })
      const prLong = new PluralRules('fr', {
        notation: 'compact',
        compactDisplay: 'long',
      })

      // Both should work (falls back to standard without NumberFormat data)
      expect(() => prShort.select(1000000)).not.toThrow()
      expect(() => prLong.select(1000000)).not.toThrow()
      // Both should return valid plural categories
      expect(['zero', 'one', 'two', 'few', 'many', 'other']).toContain(
        prShort.select(1000000)
      )
      expect(['zero', 'one', 'two', 'few', 'many', 'other']).toContain(
        prLong.select(1000000)
      )
    })
  })
})
