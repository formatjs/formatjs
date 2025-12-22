import Decimal from 'decimal.js'
import {ToRawPrecision} from '../NumberFormat/ToRawPrecision'
import {describe, expect, it} from 'vitest'

describe('ToRawPrecision', () => {
  it('ToRawPrecision(9.99, 1, 2)', () => {
    expect(ToRawPrecision(new Decimal(9.99), 1, 2, 'half-infinity')).toEqual({
      formattedString: '10',
      roundedNumber: new Decimal(10),
      integerDigitsCount: 2,
      roundingMagnitude: 1,
    })
  })

  it('ToRawPrecision(9.95, 1, 2)', () => {
    expect(ToRawPrecision(new Decimal(9.95), 1, 2, 'half-infinity')).toEqual({
      formattedString: '10',
      roundedNumber: new Decimal(10),
      integerDigitsCount: 2,
      roundingMagnitude: 1,
    })
  })

  it('ToRawPrecision(9.94, 1, 2)', () => {
    expect(ToRawPrecision(new Decimal(9.94), 1, 2, 'half-infinity')).toEqual({
      formattedString: '9.9',
      roundedNumber: new Decimal(9.9),
      integerDigitsCount: 1,
      roundingMagnitude: 0,
    })
  })

  it('ToRawPrecision(1e41, 1, 21)', () => {
    expect(ToRawPrecision(new Decimal(1e41), 1, 21, 'half-infinity')).toEqual({
      formattedString: '100000000000000000000000000000000000000000',
      roundedNumber: new Decimal(1e41),
      integerDigitsCount: 42,
      roundingMagnitude: 41,
    })
  })

  it('toRawPrecison(1e-10, 1, 21)', () => {
    expect(ToRawPrecision(new Decimal(1e-10), 1, 21, 'half-infinity')).toEqual({
      formattedString: '0.0000000001',
      roundedNumber: new Decimal(1e-10),
      integerDigitsCount: 1,
      roundingMagnitude: -10,
    })
  })

  it('ToRawPrecision(1e21, 1, 10)', () => {
    expect(ToRawPrecision(new Decimal(1e21), 1, 10, 'half-infinity')).toEqual({
      formattedString: '1000000000000000000000',
      roundedNumber: new Decimal(1e21),
      integerDigitsCount: 22,
      roundingMagnitude: 21,
    })
  })

  it('Rounding: ToRawPrecision(123.445, 3, 5)', () => {
    expect(ToRawPrecision(new Decimal(123.445), 3, 5, 'half-infinity')).toEqual(
      {
        formattedString: '123.45',
        roundedNumber: new Decimal(123.45),
        integerDigitsCount: 3,
        roundingMagnitude: 2,
      }
    )
  })

  it('ToRawPrecision(1.1, 3, 5)', () => {
    expect(ToRawPrecision(new Decimal(1.1), 3, 5, 'half-infinity')).toEqual({
      formattedString: '1.10',
      roundedNumber: new Decimal(1.1),
      integerDigitsCount: 1,
      roundingMagnitude: 0,
    })
  })

  describe('Small integers (0-59) - Issue #5023 scenario', () => {
    it('ToRawPrecision(0, 1, 21)', () => {
      expect(ToRawPrecision(new Decimal(0), 1, 21, 'half-infinity')).toEqual({
        formattedString: '0',
        roundedNumber: new Decimal(0),
        integerDigitsCount: 1,
        roundingMagnitude: 0,
      })
    })

    it('ToRawPrecision(1, 1, 2)', () => {
      expect(ToRawPrecision(new Decimal(1), 1, 2, 'half-infinity')).toEqual({
        formattedString: '1',
        roundedNumber: new Decimal(1),
        integerDigitsCount: 1,
        roundingMagnitude: 0,
      })
    })

    it('ToRawPrecision(9, 1, 2)', () => {
      expect(ToRawPrecision(new Decimal(9), 1, 2, 'half-infinity')).toEqual({
        formattedString: '9',
        roundedNumber: new Decimal(9),
        integerDigitsCount: 1,
        roundingMagnitude: 0,
      })
    })

    it('ToRawPrecision(10, 1, 2)', () => {
      expect(ToRawPrecision(new Decimal(10), 1, 2, 'half-infinity')).toEqual({
        formattedString: '10',
        roundedNumber: new Decimal(10),
        integerDigitsCount: 2,
        roundingMagnitude: 1,
      })
    })

    it('ToRawPrecision(59, 1, 2)', () => {
      expect(ToRawPrecision(new Decimal(59), 1, 2, 'half-infinity')).toEqual({
        formattedString: '59',
        roundedNumber: new Decimal(59),
        integerDigitsCount: 2,
        roundingMagnitude: 1,
      })
    })

    it('ToRawPrecision(59, 2, 4)', () => {
      expect(ToRawPrecision(new Decimal(59), 2, 4, 'half-infinity')).toEqual({
        formattedString: '59',
        roundedNumber: new Decimal(59),
        integerDigitsCount: 2,
        roundingMagnitude: 1,
      })
    })
  })

  describe('Different rounding modes', () => {
    it('ToRawPrecision(1.55, 1, 2, "half-infinity")', () => {
      expect(ToRawPrecision(new Decimal(1.55), 1, 2, 'half-infinity')).toEqual({
        formattedString: '1.6',
        roundedNumber: new Decimal(1.6),
        integerDigitsCount: 1,
        roundingMagnitude: 0,
      })
    })

    it('ToRawPrecision(2.5, 1, 2, "half-even")', () => {
      expect(ToRawPrecision(new Decimal(2.5), 1, 2, 'half-even')).toEqual({
        formattedString: '2.5',
        roundedNumber: new Decimal(2.5),
        integerDigitsCount: 1,
        roundingMagnitude: 0,
      })
    })

    it('ToRawPrecision(1.4, 1, 1, "infinity")', () => {
      expect(ToRawPrecision(new Decimal(1.4), 1, 1, 'infinity')).toEqual({
        formattedString: '2',
        roundedNumber: new Decimal(2),
        integerDigitsCount: 1,
        roundingMagnitude: 0,
      })
    })

    it('ToRawPrecision(1.9, 1, 1, "zero")', () => {
      expect(ToRawPrecision(new Decimal(1.9), 1, 1, 'zero')).toEqual({
        formattedString: '1',
        roundedNumber: new Decimal(1),
        integerDigitsCount: 1,
        roundingMagnitude: 0,
      })
    })

    it('ToRawPrecision(1.5, 1, 1, "half-zero")', () => {
      expect(ToRawPrecision(new Decimal(1.5), 1, 1, 'half-zero')).toEqual({
        formattedString: '1',
        roundedNumber: new Decimal(1),
        integerDigitsCount: 1,
        roundingMagnitude: 0,
      })
    })
  })

  describe('Edge cases and boundary values', () => {
    it('ToRawPrecision(99.99, 1, 4)', () => {
      expect(ToRawPrecision(new Decimal(99.99), 1, 4, 'half-infinity')).toEqual(
        {
          formattedString: '99.99',
          roundedNumber: new Decimal(99.99),
          integerDigitsCount: 2,
          roundingMagnitude: 1,
        }
      )
    })

    it('ToRawPrecision(99.999, 1, 4)', () => {
      expect(
        ToRawPrecision(new Decimal(99.999), 1, 4, 'half-infinity')
      ).toEqual({
        formattedString: '100',
        roundedNumber: new Decimal(100),
        integerDigitsCount: 3,
        roundingMagnitude: 2,
      })
    })

    it('ToRawPrecision(0.001, 1, 3)', () => {
      expect(ToRawPrecision(new Decimal(0.001), 1, 3, 'half-infinity')).toEqual(
        {
          formattedString: '0.001',
          roundedNumber: new Decimal(0.001),
          integerDigitsCount: 1,
          roundingMagnitude: -3,
        }
      )
    })

    it('ToRawPrecision(0.00099, 1, 2)', () => {
      expect(
        ToRawPrecision(new Decimal(0.00099), 1, 2, 'half-infinity')
      ).toEqual({
        formattedString: '0.00099',
        roundedNumber: new Decimal(0.00099),
        integerDigitsCount: 1,
        roundingMagnitude: -4,
      })
    })

    it('ToRawPrecision(999, 1, 3)', () => {
      expect(ToRawPrecision(new Decimal(999), 1, 3, 'half-infinity')).toEqual({
        formattedString: '999',
        roundedNumber: new Decimal(999),
        integerDigitsCount: 3,
        roundingMagnitude: 2,
      })
    })

    it('ToRawPrecision(1000, 1, 3)', () => {
      expect(ToRawPrecision(new Decimal(1000), 1, 3, 'half-infinity')).toEqual({
        formattedString: '1000',
        roundedNumber: new Decimal(1000),
        integerDigitsCount: 4,
        roundingMagnitude: 3,
      })
    })
  })

  describe('Precision edge cases', () => {
    it('ToRawPrecision with minPrecision = maxPrecision', () => {
      expect(ToRawPrecision(new Decimal(12.34), 4, 4, 'half-infinity')).toEqual(
        {
          formattedString: '12.34',
          roundedNumber: new Decimal(12.34),
          integerDigitsCount: 2,
          roundingMagnitude: 1,
        }
      )
    })

    it('ToRawPrecision(12.3456, 1, 21) - max precision', () => {
      expect(
        ToRawPrecision(new Decimal(12.3456), 1, 21, 'half-infinity')
      ).toEqual({
        formattedString: '12.3456',
        roundedNumber: new Decimal(12.3456),
        integerDigitsCount: 2,
        roundingMagnitude: 1,
      })
    })

    it('ToRawPrecision(123.456, 5, 7) - trailing zeros stripped', () => {
      expect(
        ToRawPrecision(new Decimal(123.456), 5, 7, 'half-infinity')
      ).toEqual({
        formattedString: '123.456',
        roundedNumber: new Decimal(123.456),
        integerDigitsCount: 3,
        roundingMagnitude: 2,
      })
    })
  })

  describe('Performance-critical values (common in date formatting)', () => {
    // These are common values in time display (hours, minutes, seconds)
    const testCases = [
      {value: 0, expected: '0'},
      {value: 12, expected: '12'},
      {value: 23, expected: '23'},
      {value: 30, expected: '30'},
      {value: 45, expected: '45'},
      {value: 59, expected: '59'},
    ]

    testCases.forEach(({value, expected}) => {
      it(`ToRawPrecision(${value}, 1, 2) for time display`, () => {
        const result = ToRawPrecision(new Decimal(value), 1, 2, 'half-infinity')
        expect(result.formattedString).toBe(expected)
        expect(result.roundedNumber.toNumber()).toBe(value)
      })
    })
  })
})
