import Decimal from 'decimal.js'
import {ToRawFixed} from '../NumberFormat/ToRawFixed'
import {expect, it, test} from 'vitest'
test('ToRawFixed(9.99, 0, 1)', () => {
  expect(ToRawFixed(new Decimal(9.99), 0, 1, 1, 'half-infinity')).toEqual({
    formattedString: '10',
    roundedNumber: new Decimal(10),
    integerDigitsCount: 2,
    roundingMagnitude: -1,
  })
})

test('ToRawFixed(1e41, 0, 3)', () => {
  expect(ToRawFixed(new Decimal(1e41), 0, 3, 1, 'half-infinity')).toEqual({
    formattedString: '100000000000000000000000000000000000000000',
    roundedNumber: new Decimal(1e41),
    integerDigitsCount: 42,
    roundingMagnitude: -3,
  })
})

test('ToRawFixed(1e-10, 1, 21)', () => {
  expect(ToRawFixed(new Decimal(1e-10), 1, 21, 1, 'half-infinity')).toEqual({
    formattedString: '0.0000000001',
    roundedNumber: new Decimal(1e-10),
    integerDigitsCount: 1,
    roundingMagnitude: -21,
  })
})

test('Rounding: ToRawFixed(123.445, 0, 2)', () => {
  expect(ToRawFixed(new Decimal(123.445), 0, 2, 1, 'half-infinity')).toEqual({
    formattedString: '123.45',
    roundedNumber: new Decimal(123.45),
    integerDigitsCount: 3,
    roundingMagnitude: -2,
  })
})

it('ToRawFixed(1.2344501e+34, 1, 3)', () => {
  expect(
    ToRawFixed(new Decimal(1.2344501e34), 1, 3, 1, 'half-infinity')
  ).toEqual({
    formattedString: '12344501000000000000000000000000000.0',
    roundedNumber: new Decimal(1.2344501e34),
    integerDigitsCount: 35,
    roundingMagnitude: -3,
  })
})

it('ToRawFixed(1,234,567,891,234,567.35, 2, 2)', () => {
  expect(
    ToRawFixed(new Decimal('1234567891234567.35'), 2, 2, 1, 'half-infinity')
  ).toEqual({
    formattedString: '1234567891234567.35',
    roundedNumber: new Decimal('1234567891234567.35'),
    integerDigitsCount: 16,
    roundingMagnitude: -2,
  })
})
