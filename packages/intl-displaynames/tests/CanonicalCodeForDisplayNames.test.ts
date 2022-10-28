import {CanonicalCodeForDisplayNames} from '../abstract/CanonicalCodeForDisplayNames'

describe('CanonicalCodeForDisplayNames', () => {
  describe('when type is "language"', () => {
    it('returns the code in the the canonical and case-regularized form', () => {
      const canonicalCode = CanonicalCodeForDisplayNames('language', 'EN')
      expect(canonicalCode).toBe('en')
    })
  })

  describe('when type is "region"', () => {
    it('thows a range error if code does not match the unicode region subtag', () => {
      expect(() =>
        CanonicalCodeForDisplayNames('region', 'invalid_region_subtag')
      ).toThrow(RangeError)
    })

    it('returns the code in upper case', () => {
      const canonicalCode = CanonicalCodeForDisplayNames('region', 'us')
      expect(canonicalCode).toBe('US')
    })
  })

  describe('when type is "script"', () => {
    it('thows a range error if code does not match the unicode script subtag', () => {
      expect(() =>
        CanonicalCodeForDisplayNames('script', 'invalid_script_subtag')
      ).toThrow(RangeError)
    })

    it('returns the code capitalized', () => {
      const canonicalCode = CanonicalCodeForDisplayNames('script', 'latn')
      expect(canonicalCode).toBe('Latn')
    })
  })

  describe('when type is "calendar"', () => {
    it('thows a range error if code does not match the unicode local identifier type', () => {
      expect(() =>
        CanonicalCodeForDisplayNames('calendar', 'invalidCalendarCode')
      ).toThrow(RangeError)
    })

    it('returns the code in lower case', () => {
      const canonicalCode = CanonicalCodeForDisplayNames('calendar', 'PERSIAN')
      expect(canonicalCode).toBe('persian')
    })
  })

  describe('when type is "dateTimeField"', () => {
    it('thows a range error if code is not a valid time field code', () => {
      expect(() =>
        CanonicalCodeForDisplayNames('dateTimeField', 'invalid_dateTimeField')
      ).toThrow(RangeError)
    })

    it('returns the code', () => {
      const canonicalCode = CanonicalCodeForDisplayNames(
        'dateTimeField',
        'year'
      )
      expect(canonicalCode).toBe('year')
    })
  })

  describe('when type is "currency"', () => {
    it('returns the code in upper case', () => {
      const canonicalCode = CanonicalCodeForDisplayNames('currency', 'usd')
      expect(canonicalCode).toBe('USD')
    })
  })
})
