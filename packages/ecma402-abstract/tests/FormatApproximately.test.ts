import {FormatApproximately} from '#packages/ecma402-abstract/NumberFormat/FormatApproximately.js'
import {type NumberFormatPart} from '#packages/ecma402-abstract/types/number.js'
import {getInternalSlots} from '#packages/ecma402-abstract/tests/utils.js'
import {describe, expect, it} from 'vitest'
describe('FormatApproximately', () => {
  const numberFormat: Intl.NumberFormat = new Intl.NumberFormat('it')

  it('append approximatelySign', () => {
    const result: NumberFormatPart[] = []
    FormatApproximately(getInternalSlots(numberFormat), result)

    expect(result).toMatchObject([{type: 'approximatelySign', value: '~'}])
  })
})
