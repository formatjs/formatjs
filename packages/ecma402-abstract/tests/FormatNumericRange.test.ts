import Decimal from 'decimal.js'
import {FormatNumericRange} from '../NumberFormat/FormatNumericRange.js'
import {getInternalSlots} from './utils.js'
import {describe, expect, it} from 'vitest'
describe('FormatNumericRange', () => {
  const numberFormat: Intl.NumberFormat = new Intl.NumberFormat('it')

  it('correctly return numeric range', () => {
    const result = FormatNumericRange(
      numberFormat,
      new Decimal(3),
      new Decimal(10),
      {getInternalSlots}
    )

    expect(result).toBe('3-10')
  })

  it('correctly return numeric range with single negative number', () => {
    const result = FormatNumericRange(
      numberFormat,
      new Decimal(-3),
      new Decimal(10),
      {getInternalSlots}
    )

    expect(result).toBe('-3-10')
  })

  it('correctly return numeric range with both negative numbers', () => {
    const result = FormatNumericRange(
      numberFormat,
      new Decimal(-10),
      new Decimal(-3),
      {getInternalSlots}
    )

    expect(result).toBe('-10--3')
  })
})
