import {NumberFormatInternal} from '..'
import {PartitionNumberRangePattern} from '../NumberFormat/PartitionNumberRangePattern'
import it from '@formatjs/intl-pluralrules/locale-data/it.json'

const internalSlotMap = new WeakMap<Intl.NumberFormat, NumberFormatInternal>()

function getInternalSlots(x: Intl.NumberFormat): NumberFormatInternal {
  let internalSlots = internalSlotMap.get(x)
  if (!internalSlots) {
    internalSlots = Object.create(null) as NumberFormatInternal
    internalSlotMap.set(x, internalSlots)
  }
  return {
    ...internalSlots,
    numberingSystem: 'latn',
    dataLocaleData: {
      numbers: it.data.numbers,
      currencies: it.data.currencies,
      nu: it.data.nu,
      // @ts-ignore
      units: it.data.units,
    },
  }
}

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

  describe('X is finite', () => {
    test('Y must be bigger than X', () => {
      const executeFunction = () =>
        PartitionNumberRangePattern(numberFormat, 3, 2, {getInternalSlots})
      expect(executeFunction).toThrowError('Y input must be bigger than X')
    })

    test('Y must not be NegativeInfinity', () => {
      const executeFunction = () =>
        PartitionNumberRangePattern(numberFormat, 3, Number.NEGATIVE_INFINITY, {
          getInternalSlots,
        })
      expect(executeFunction).toThrowError(
        'Y input must not be NegativeInfinity'
      )
    })

    test('Y is negative zero', () => {
      const executeFunction = () =>
        PartitionNumberRangePattern(numberFormat, 0, -0, {
          getInternalSlots,
        })
      expect(executeFunction).toThrowError('Y input must be bigger than X')
    })
  })

  describe('X is positive infinity', () => {
    test('Y is finite', () => {
      const executeFunction = () =>
        PartitionNumberRangePattern(numberFormat, Number.POSITIVE_INFINITY, 1, {
          getInternalSlots,
        })
      expect(executeFunction).toThrowError('Y input must be bigger than X')
    })

    test('Y is negative infinity', () => {
      const executeFunction = () =>
        PartitionNumberRangePattern(
          numberFormat,
          Number.POSITIVE_INFINITY,
          Number.NEGATIVE_INFINITY,
          {
            getInternalSlots,
          }
        )
      expect(executeFunction).toThrowError('Y input must be bigger than X')
    })

    test('Y is negative zero', () => {
      const executeFunction = () =>
        PartitionNumberRangePattern(
          numberFormat,
          Number.POSITIVE_INFINITY,
          -0,
          {
            getInternalSlots,
          }
        )
      expect(executeFunction).toThrowError('Y input must be bigger than X')
    })
  })

  test('return range', () => {
    const result = PartitionNumberRangePattern(numberFormat, 0, 1, {
      getInternalSlots,
    })
    expect(result).toMatchObject([
      {source: 'startRange', type: 'integer', value: '0'},
      {source: 'startRange', type: 'percentSign', value: '%'},
      {source: 'shared', type: 'literal', value: ':'},
      {source: 'endRange', type: 'plusSign', value: '+'},
      {source: 'endRange', type: 'integer', value: '1'},
      {source: 'endRange', type: 'percentSign', value: '%'},
    ])
  })
})
