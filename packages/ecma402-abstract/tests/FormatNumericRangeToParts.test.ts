import Decimal from '@formatjs/bigdecimal'
import {FormatNumericRangeToParts} from '#packages/ecma402-abstract/NumberFormat/FormatNumericRangeToParts.js'
import {getInternalSlots} from '#packages/ecma402-abstract/tests/utils.js'
import {describe, expect, it} from 'vitest'
describe('FormatNumericRangeToParts', () => {
  const numberFormat: Intl.NumberFormat = new Intl.NumberFormat('it')

  it('correctly return numeric range', () => {
    const result = FormatNumericRangeToParts(
      numberFormat,
      new Decimal(3),
      new Decimal(10),
      {
        getInternalSlots,
      }
    )

    expect(result).toEqual([
      {source: 'startRange', type: 'integer', value: '3'},
      {source: 'shared', type: 'literal', value: '-'},
      {source: 'endRange', type: 'integer', value: '10'},
    ])
  })

  it('correctly return numeric range with single negative number', () => {
    const result = FormatNumericRangeToParts(
      numberFormat,
      new Decimal(-3),
      new Decimal(10),
      {
        getInternalSlots,
      }
    )

    expect(result).toEqual([
      {source: 'startRange', type: 'minusSign', value: '-'},
      {source: 'startRange', type: 'integer', value: '3'},
      {source: 'shared', type: 'literal', value: '-'},
      {source: 'endRange', type: 'integer', value: '10'},
    ])
  })

  it('correctly return numeric range with both negative numbers', () => {
    const result = FormatNumericRangeToParts(
      numberFormat,
      new Decimal(-10),
      new Decimal(-3),
      {
        getInternalSlots,
      }
    )

    expect(result).toEqual([
      {source: 'startRange', type: 'minusSign', value: '-'},
      {source: 'startRange', type: 'integer', value: '10'},
      {source: 'shared', type: 'literal', value: ' - '},
      {source: 'endRange', type: 'minusSign', value: '-'},
      {source: 'endRange', type: 'integer', value: '3'},
    ])
  })
})
