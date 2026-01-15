import {supportedValuesOf} from '../src/index.js'
import {describe, expect, it} from 'vitest'

describe('Intl.supportedValuesOf', () => {
  describe('ECMA-402 spec compliance', () => {
    it('should return an array for valid keys', () => {
      // ECMA-402 Spec: Must return an array
      const result = supportedValuesOf('calendar')
      expect(Array.isArray(result)).toBe(true)
    })

    it('should throw RangeError for invalid key', () => {
      // ECMA-402 Spec: Throw RangeError for invalid keys
      // @ts-expect-error
      expect(() => supportedValuesOf('invalid')).toThrow(RangeError)
      // @ts-expect-error
      expect(() => supportedValuesOf('calendars')).toThrowError(
        'Invalid key: calendars'
      )
      // @ts-expect-error
      expect(() => supportedValuesOf('calendarz')).toThrowError(RangeError)
    })

    it('should return sorted arrays', () => {
      // ECMA-402 Spec: Results must be sorted lexicographically
      const keys = [
        'calendar',
        'collation',
        'currency',
        'numberingSystem',
        'timeZone',
        'unit',
      ] as const

      for (const key of keys) {
        const result = supportedValuesOf(key)
        const sorted = [...result].sort()
        expect(result).toEqual(sorted)
      }
    })

    it('should return non-empty arrays for all keys', () => {
      // Implementation: All keys must return at least some supported values
      const keys = [
        'calendar',
        'collation',
        'currency',
        'numberingSystem',
        'timeZone',
        'unit',
      ] as const

      for (const key of keys) {
        const result = supportedValuesOf(key)
        expect(result.length).toBeGreaterThan(0)
      }
    })

    it('should return unique values', () => {
      // ECMA-402 Spec: Array must contain unique values
      const keys = [
        'calendar',
        'collation',
        'currency',
        'numberingSystem',
        'timeZone',
        'unit',
      ] as const

      for (const key of keys) {
        const result = supportedValuesOf(key)
        const unique = [...new Set(result)]
        expect(result).toEqual(unique)
      }
    })
  })

  describe('calendar', () => {
    it('should return an array of supported calendars', () => {
      const result = supportedValuesOf('calendar')
      expect(result).toEqual(expect.any(Array))
      expect(result.length).toBeGreaterThan(0)
    })

    it('should include gregorian calendar', () => {
      // Implementation: Gregorian calendar should always be supported
      const result = supportedValuesOf('calendar')
      expect(result).toContain('gregory')
    })
  })

  describe('collation', () => {
    it('should return an array of supported collations', () => {
      const result = supportedValuesOf('collation')
      expect(result).toEqual(expect.any(Array))
      expect(result.length).toBeGreaterThan(0)
    })
  })

  describe('currency', () => {
    it('should return an array of supported currencies', () => {
      const result = supportedValuesOf('currency')
      expect(result).toEqual(expect.any(Array))
      expect(result.length).toBeGreaterThan(0)
    })

    it('should include common currencies', () => {
      // Implementation: Common currencies should be supported
      const result = supportedValuesOf('currency')
      expect(result).toContain('USD')
      expect(result).toContain('EUR')
    })
  })

  describe('numberingSystem', () => {
    it('should return an array of supported numbering systems', () => {
      const result = supportedValuesOf('numberingSystem')
      expect(result).toEqual(expect.any(Array))
      expect(result.length).toBeGreaterThan(0)
    })

    it('should include latin numbering system', () => {
      // Implementation: Latin numbering system should always be supported
      const result = supportedValuesOf('numberingSystem')
      expect(result).toContain('latn')
    })
  })

  describe('timeZone', () => {
    it('should return an array of supported time zones', () => {
      const result = supportedValuesOf('timeZone')
      expect(result).toEqual(expect.any(Array))
      expect(result.length).toBeGreaterThan(0)
    })

    it('should include common IANA timezones', () => {
      // Implementation: Common IANA timezones should be supported
      const result = supportedValuesOf('timeZone')
      // Test for a commonly available timezone
      const hasCommonTimezone =
        result.includes('America/New_York') ||
        result.includes('Europe/London') ||
        result.includes('Asia/Tokyo')
      expect(hasCommonTimezone).toBe(true)
    })
  })

  describe('unit', () => {
    it('should return an array of supported units', () => {
      const result = supportedValuesOf('unit')
      expect(result).toEqual(expect.any(Array))
      expect(result.length).toBeGreaterThan(0)
    })
  })
})
