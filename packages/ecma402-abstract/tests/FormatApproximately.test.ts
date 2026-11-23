import Decimal from '@formatjs/bigdecimal'
import {FormatApproximately} from '#packages/ecma402-abstract/NumberFormat/FormatApproximately.js'
import {PartitionNumberPattern} from '#packages/ecma402-abstract/NumberFormat/PartitionNumberPattern.js'
import {getInternalSlots} from '#packages/ecma402-abstract/tests/utils.js'
import {describe, expect, it} from 'vitest'

describe('FormatApproximately', () => {
  const numberFormat = new Intl.NumberFormat('it')
  const approximate = (
    value: number,
    slots = getInternalSlots(numberFormat)
  ) => {
    const style = {pattern: '', sign: 0}
    const parts = PartitionNumberPattern(slots, new Decimal(value), style)
    return FormatApproximately(slots, parts, style)
  }

  it('places the approximately sign before the number and its sign', () => {
    expect(approximate(3)).toEqual([
      {type: 'approximatelySign', value: '~'},
      {type: 'integer', value: '3'},
    ])
    expect(approximate(-3)).toEqual([
      {type: 'approximatelySign', value: '~'},
      {type: 'minusSign', value: '-'},
      {type: 'integer', value: '3'},
    ])
  })

  it('omits an empty approximately sign', () => {
    const slots = getInternalSlots(numberFormat)
    slots.dataLocaleData.numbers.symbols.latn.approximatelySign = ''
    expect(approximate(3, slots)).toEqual([{type: 'integer', value: '3'}])
  })
})
