import {FormatApproximately} from '../NumberFormat/FormatApproximately'
import {NumberFormatPart} from '../types/number'
import {getInternalSlots} from './utils'
import {describe, expect, it} from 'vitest'
describe('FormatApproximately', () => {
  const numberFormat: Intl.NumberFormat = new Intl.NumberFormat('it')

  it('append approximatelySign', () => {
    const result: NumberFormatPart[] = []
    FormatApproximately(getInternalSlots(numberFormat), result)

    expect(result).toMatchObject([{type: 'approximatelySign', value: '~'}])
  })
})
