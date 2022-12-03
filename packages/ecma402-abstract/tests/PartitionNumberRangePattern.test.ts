import {PartitionNumberRangePattern} from '../NumberFormat/PartitionNumberRangePattern'
import {getInternalSlots} from './utils'

describe('PartitionNumberRangePattern', () => {
  const numberFormat: Intl.NumberFormat = new Intl.NumberFormat('it')

  describe('throws for not numbers', () => {
    test('x is NaN', () => {
      const executeFunction = () =>
        PartitionNumberRangePattern(numberFormat, NaN, 2, {getInternalSlots})
      expect(executeFunction).toThrowError('Input must be a number')
    })

    test('y is NaN', () => {
      const executeFunction = () =>
        PartitionNumberRangePattern(numberFormat, 2, NaN, {getInternalSlots})
      expect(executeFunction).toThrowError('Input must be a number')
    })
  })

  test('return range', () => {
    const result = PartitionNumberRangePattern(numberFormat, 0, 1, {
      getInternalSlots,
    })
    expect(result).toMatchObject([
      {source: 'startRange', type: 'integer', value: '0'},
      {source: 'shared', type: 'literal', value: '-'},
      {source: 'endRange', type: 'integer', value: '1'},
    ])
  })
})
