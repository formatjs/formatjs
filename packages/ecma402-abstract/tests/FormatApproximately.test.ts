import {FormatApproximately} from '../NumberFormat/FormatApproximately.js'
import {type NumberFormatPart} from '../types/number.js'
import {getInternalSlots} from './utils.js'
import {describe, expect, it} from 'vitest'
describe('FormatApproximately', () => {
  const numberFormat: Intl.NumberFormat = new Intl.NumberFormat('it')

  it('append approximatelySign', () => {
    const result: NumberFormatPart[] = []
    FormatApproximately(getInternalSlots(numberFormat), result)

    expect(result).toMatchObject([{type: 'approximatelySign', value: '~'}])
  })
})
