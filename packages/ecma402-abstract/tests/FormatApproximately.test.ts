import {FormatApproximately} from '../NumberFormat/FormatApproximately'
import {NumberFormatPart} from '../types/number'
import {getInternalSlots} from './utils'

describe('FormatApproximately', () => {
  const numberFormat: Intl.NumberFormat = new Intl.NumberFormat('it')

  it('append approximatelySign', () => {
    const result: NumberFormatPart[] = []
    FormatApproximately(numberFormat, result, {getInternalSlots})

    expect(result).toMatchObject([{type: 'approximatelySign', value: '~'}])
  })
})
