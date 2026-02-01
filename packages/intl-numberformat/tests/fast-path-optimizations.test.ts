import {describe, it, expect} from 'vitest'
import {NumberFormat} from '../src/core'
import en from './locale-data/en.json' with {type: 'json'}
NumberFormat.__addLocaleData(en as any)

describe('Fast-path optimizations', () => {
  describe('Basic integer formatting (fast path)', () => {
    const nf = new NumberFormat('en')

    it('should format zero', () => {
      expect(nf.format(0)).toBe('0')
    })

    it('should format single digits', () => {
      expect(nf.format(1)).toBe('1')
      expect(nf.format(9)).toBe('9')
    })

    it('should format two-digit numbers', () => {
      expect(nf.format(42)).toBe('42')
      expect(nf.format(99)).toBe('99')
    })

    it('should format three-digit numbers', () => {
      expect(nf.format(100)).toBe('100')
      expect(nf.format(999)).toBe('999')
    })

    it('should format four-digit numbers with grouping', () => {
      expect(nf.format(1000)).toBe('1,000')
      expect(nf.format(9999)).toBe('9,999')
    })

    it('should format large numbers within fast-path range', () => {
      expect(nf.format(999999)).toBe('999,999')
    })

    it('should format negative numbers', () => {
      expect(nf.format(-42)).toBe('-42')
      expect(nf.format(-999)).toBe('-999')
      expect(nf.format(-1000)).toBe('-1,000')
    })
  })

  describe('formatToParts with fast path', () => {
    const nf = new NumberFormat('en')

    it('should produce correct parts for simple numbers', () => {
      const parts = nf.formatToParts(1234)
      const hasInteger = parts.some(p => p.type === 'integer')
      const hasGroup = parts.some(p => p.type === 'group')
      expect(hasInteger).toBe(true)
      expect(hasGroup).toBe(true)
    })

    it('should produce correct parts for zero', () => {
      const parts = nf.formatToParts(0)
      expect(parts).toEqual([{type: 'integer', value: '0'}])
    })

    it('should produce correct parts for negative numbers', () => {
      const parts = nf.formatToParts(-42)
      expect(parts[0]).toEqual({type: 'minusSign', value: '-'})
      expect(parts[1]).toEqual({type: 'integer', value: '42'})
    })
  })

  describe('Currency formatting with fast path', () => {
    const nfCurrency = new NumberFormat('en', {
      style: 'currency',
      currency: 'USD',
    })

    it('should format integer currency values', () => {
      expect(nfCurrency.format(42)).toBe('$42.00')
      expect(nfCurrency.format(0)).toBe('$0.00')
      expect(nfCurrency.format(999)).toBe('$999.00')
    })

    it('should format negative currency values', () => {
      expect(nfCurrency.format(-42)).toBe('-$42.00')
    })

    it('should format large currency values', () => {
      expect(nfCurrency.format(999999)).toBe('$999,999.00')
    })
  })

  describe('Percent formatting with fast path', () => {
    const nfPercent = new NumberFormat('en', {style: 'percent'})

    it('should format decimal as percent', () => {
      expect(nfPercent.format(0.42)).toBe('42%')
    })

    it('should format zero percent', () => {
      expect(nfPercent.format(0)).toBe('0%')
    })

    it('should format negative percent', () => {
      expect(nfPercent.format(-0.5)).toBe('-50%')
    })

    it('should format 100%', () => {
      expect(nfPercent.format(1)).toBe('100%')
    })
  })

  describe('Edge cases that bypass fast path', () => {
    const nf = new NumberFormat('en')

    it('should handle NaN', () => {
      expect(nf.format(NaN)).toBe('NaN')
    })

    it('should handle Infinity', () => {
      expect(nf.format(Infinity)).toBe('∞')
      expect(nf.format(-Infinity)).toBe('-∞')
    })

    it('should handle decimal numbers', () => {
      expect(nf.format(0.123)).toBe('0.123')
      expect(nf.format(1.5)).toBe('1.5')
    })

    it('should handle very large numbers', () => {
      expect(nf.format(1e20)).toBe('100,000,000,000,000,000,000')
    })

    it('should handle numbers beyond fast-path range', () => {
      expect(nf.format(1000000)).toBe('1,000,000')
      expect(nf.format(10000000)).toBe('10,000,000')
    })
  })

  describe('Fast path performance characteristics', () => {
    const nf = new NumberFormat('en')

    it('should format common time values efficiently (0-59)', () => {
      // These should all hit the fast path
      for (let i = 0; i < 60; i++) {
        const result = nf.format(i)
        expect(result).toBe(String(i))
      }
    })

    it('should format common date values efficiently (1-31)', () => {
      // Common day-of-month values
      for (let i = 1; i <= 31; i++) {
        const result = nf.format(i)
        expect(result).toBe(String(i))
      }
    })

    it('should format percentages efficiently', () => {
      // Common percentage values from 0-100
      for (let i = 0; i <= 100; i++) {
        const result = nf.format(i)
        expect(typeof result).toBe('string')
        expect(result.length).toBeGreaterThan(0)
      }
    })
  })

  describe('Mixed fast and slow path in same formatter', () => {
    const nf = new NumberFormat('en', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })

    it('should handle both integer and decimal formatting', () => {
      // Fast path integers
      expect(nf.format(42)).toBe('42.00')
      expect(nf.format(0)).toBe('0.00')

      // Slow path decimals
      expect(nf.format(42.5)).toBe('42.50')
      expect(nf.format(0.123)).toBe('0.12')
    })
  })

  describe('Grouping with fast path', () => {
    it('should handle different grouping settings', () => {
      const nfAlways = new NumberFormat('en', {useGrouping: 'always'})
      expect(nfAlways.format(999)).toBe('999')
      expect(nfAlways.format(1000)).toBe('1,000')

      const nfMin2 = new NumberFormat('en', {useGrouping: 'min2'})
      expect(nfMin2.format(1000)).toBe('1000')
      expect(nfMin2.format(10000)).toBe('10,000')

      const nfFalse = new NumberFormat('en', {useGrouping: false})
      expect(nfFalse.format(1000000)).toBe('1000000')
    })
  })
})
