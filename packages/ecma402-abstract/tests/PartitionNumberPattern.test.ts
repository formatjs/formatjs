import Decimal from 'decimal.js'
import {PartitionNumberPattern} from '../NumberFormat/PartitionNumberPattern'
import {getInternalSlots} from './utils'
import {describe, expect, test, it} from 'vitest'
describe('PartitionNumberPattern', () => {
  const decimalNumberFormat: Intl.NumberFormat = new Intl.NumberFormat('it', {
    style: 'decimal',
  })

  test('manages NaN', () => {
    const result = PartitionNumberPattern(
      getInternalSlots(decimalNumberFormat),
      new Decimal(NaN)
    )

    expect(result).toEqual([{type: 'nan', value: 'NaN'}])
  })

  describe('manage numbers', () => {
    it('positive number', () => {
      const result = PartitionNumberPattern(
        getInternalSlots(decimalNumberFormat),
        new Decimal(+3)
      )

      expect(result).toEqual([{type: 'integer', value: '3'}])
    })

    it('positive number with sign', () => {
      const numberFormat = new Intl.NumberFormat('it', {
        style: 'decimal',
        signDisplay: 'always',
      })
      const result = PartitionNumberPattern(
        getInternalSlots(numberFormat),
        new Decimal(+3)
      )

      expect(result).toEqual([
        {type: 'plusSign', value: '+'},
        {type: 'integer', value: '3'},
      ])
    })

    it('positive number in percent style', () => {
      const numberFormat = new Intl.NumberFormat('it', {
        style: 'percent',
        signDisplay: 'always',
      })
      const result = PartitionNumberPattern(
        getInternalSlots(numberFormat),
        new Decimal(+3)
      )

      expect(result).toEqual([
        {type: 'plusSign', value: '+'},
        {type: 'integer', value: '300'},
        {type: 'percentSign', value: '%'},
      ])
    })

    it('negative number', () => {
      const result = PartitionNumberPattern(
        getInternalSlots(decimalNumberFormat),
        new Decimal(-3)
      )

      expect(result).toEqual([
        {type: 'minusSign', value: '-'},
        {type: 'integer', value: '3'},
      ])
    })
  })

  describe('manage Infinity', () => {
    it('positive infinity', () => {
      const result = PartitionNumberPattern(
        getInternalSlots(decimalNumberFormat),
        new Decimal(Number.POSITIVE_INFINITY)
      )

      expect(result).toEqual([{type: 'infinity', value: '∞'}])
    })

    it('negative number', () => {
      const result = PartitionNumberPattern(
        getInternalSlots(decimalNumberFormat),
        new Decimal(Number.NEGATIVE_INFINITY)
      )

      expect(result).toEqual([
        {type: 'minusSign', value: '-'},
        {type: 'infinity', value: '∞'},
      ])
    })
  })
})
