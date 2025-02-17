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
})
