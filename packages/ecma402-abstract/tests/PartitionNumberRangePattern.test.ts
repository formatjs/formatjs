import Decimal from 'decimal.js'
import {PartitionNumberRangePattern} from '../NumberFormat/PartitionNumberRangePattern'
import {getInternalSlots} from './utils'
import {describe, expect, test} from 'vitest'
describe('PartitionNumberRangePattern', () => {
  const numberFormat: Intl.NumberFormat = new Intl.NumberFormat('it')

  describe('throws for not numbers', () => {
    test('x is NaN', () => {
      const executeFunction = () =>
        PartitionNumberRangePattern(
          numberFormat,
          new Decimal(NaN),
          new Decimal(2),
          {getInternalSlots}
        )
      expect(executeFunction).toThrowError('Input must be a number')
    })

    test('y is NaN', () => {
      const executeFunction = () =>
        PartitionNumberRangePattern(
          numberFormat,
          new Decimal(2),
          new Decimal(NaN),
          {getInternalSlots}
        )
      expect(executeFunction).toThrowError('Input must be a number')
    })
  })

  test('return range', () => {
    const result = PartitionNumberRangePattern(
      numberFormat,
      new Decimal(0),
      new Decimal(1),
      {
        getInternalSlots,
      }
    )
    expect(result).toMatchObject([
      {source: 'startRange', type: 'integer', value: '0'},
      {source: 'shared', type: 'literal', value: '-'},
      {source: 'endRange', type: 'integer', value: '1'},
    ])
  })
})
