import {FormatNumericRange} from '../NumberFormat/FormatNumericRange'
import {getInternalSlots} from './utils'

describe('FormatApproximately', () => {
  const numberFormat: Intl.NumberFormat = new Intl.NumberFormat('it')

  it('correctly return numeric range', () => {
    const result = FormatNumericRange(numberFormat, 3, 10, {getInternalSlots})

    expect(result).toBe('3 - 10')
  })

  it('correctly return numeric range with single negative number', () => {
    const result = FormatNumericRange(numberFormat, -3, 10, {getInternalSlots})

    expect(result).toBe('-3 - 10')
  })

  it('correctly return numeric range with both negative numbers', () => {
    const result = FormatNumericRange(numberFormat, -10, -3, {getInternalSlots})

    expect(result).toBe('-10 - -3')
  })

  it('throws for invalid range', () => {
    const executeFunction = () =>
      FormatNumericRange(numberFormat, -3, -10, {getInternalSlots})

    expect(executeFunction).toThrowError(
      new RangeError('Y input must be bigger than X')
    )
  })
})
