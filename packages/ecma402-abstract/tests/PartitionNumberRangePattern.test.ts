import {NumberFormatInternal} from '..'
import {PartitionNumberRangePattern} from '../NumberFormat/PartitionNumberRangePattern'

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
    // @ts-ignore
    dataLocaleData: {
      numbers: {
        nu: ['latn'],
        symbols: {
          latn: {
            decimal: ',',
            group: '.',
            list: ';',
            percentSign: '%',
            plusSign: '+',
            minusSign: '-',
            approximatelySign: '~',
            exponential: 'E',
            superscriptingExponent: '×',
            perMille: '‰',
            infinity: '∞',
            nan: 'NaN',
            timeSeparator: ':',
          },
        },
        percent: {
          latn: '#,##0%',
        },
        decimal: {
          latn: {
            standard: '#,##0.###',
            long: {
              '1000': {
                other: '0 mila',
                one: 'mille',
              },
              '10000': {
                other: '00 mila',
              },
              '100000': {
                other: '000 mila',
              },
              '1000000': {
                other: '0 milioni',
                one: '0 milione',
              },
              '10000000': {
                other: '00 milioni',
              },
              '100000000': {
                other: '000 milioni',
              },
              '1000000000': {
                other: '0 miliardi',
                one: '0 miliardo',
              },
              '10000000000': {
                other: '00 miliardi',
              },
              '100000000000': {
                other: '000 miliardi',
              },
              '1000000000000': {
                other: '0 mila miliardi',
                one: '0 mille miliardi',
              },
              '10000000000000': {
                other: '00 mila miliardi',
              },
              '100000000000000': {
                other: '000 mila miliardi',
              },
            },
            short: {
              '1000': {
                other: '0',
              },
              '10000': {
                other: '0',
              },
              '100000': {
                other: '0',
              },
              '1000000': {
                other: '0 Mln',
              },
              '10000000': {
                other: '00 Mln',
              },
              '100000000': {
                other: '000 Mln',
              },
              '1000000000': {
                other: '0 Mrd',
              },
              '10000000000': {
                other: '00 Mrd',
              },
              '100000000000': {
                other: '000 Mrd',
              },
              '1000000000000': {
                other: '0 Bln',
              },
              '10000000000000': {
                other: '00 Bln',
              },
              '100000000000000': {
                other: '000 Bln',
              },
            },
          },
        },
        currency: {
          latn: {
            currencySpacing: {
              beforeInsertBetween: ' ',
              afterInsertBetween: ' ',
            },
            standard: '#,##0.00 ¤',
            accounting: '#,##0.00 ¤',
            unitPattern: '{0} {1}',
            short: {
              '1000': {
                other: '0',
              },
              '10000': {
                other: '0',
              },
              '100000': {
                other: '0',
              },
              '1000000': {
                other: '0 Mio ¤',
              },
              '10000000': {
                other: '00 Mio ¤',
              },
              '100000000': {
                other: '000 Mio ¤',
              },
              '1000000000': {
                other: '0 Mrd ¤',
              },
              '10000000000': {
                other: '00 Mrd ¤',
              },
              '100000000000': {
                other: '000 Mrd ¤',
              },
              '1000000000000': {
                other: '0 Bln ¤',
              },
              '10000000000000': {
                other: '00 Bln ¤',
              },
              '100000000000000': {
                other: '000 Bln ¤',
              },
            },
          },
        },
      },
      nu: ['latn'],
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
