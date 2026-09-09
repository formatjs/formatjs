import Decimal from '@formatjs/bigdecimal'
import {FormatApproximately} from '#packages/ecma402-abstract/NumberFormat/FormatApproximately.js'
import {getInternalSlots} from '#packages/ecma402-abstract/tests/utils.js'
import {describe, expect, it} from 'vitest'

describe('FormatApproximately', () => {
  const numberFormat = new Intl.NumberFormat('it')

  it('places the approximately sign before the number and its sign', () => {
    expect(
      FormatApproximately(getInternalSlots(numberFormat), new Decimal(3))
    ).toEqual([
      {type: 'approximatelySign', value: '~'},
      {type: 'integer', value: '3'},
    ])
    expect(
      FormatApproximately(getInternalSlots(numberFormat), new Decimal(-3))
    ).toEqual([
      {type: 'approximatelySign', value: '~'},
      {type: 'minusSign', value: '-'},
      {type: 'integer', value: '3'},
    ])
  })

  it('omits an empty approximately sign', () => {
    const slots = getInternalSlots(numberFormat)
    slots.dataLocaleData.numbers.symbols.latn.approximatelySign = ''
    expect(FormatApproximately(slots, new Decimal(3))).toEqual([
      {type: 'integer', value: '3'},
    ])
  })
})
