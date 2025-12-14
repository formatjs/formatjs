import {describe, it, beforeAll, expect} from 'vitest'
import {NumberFormatOptions} from '@formatjs/ecma402-abstract'
import '@formatjs/intl-pluralrules/polyfill.js'
import {NumberFormat} from '../src/core'

const SIGN_DISPLAYS: Array<NumberFormatOptions['signDisplay']> = [
  'auto',
  'always',
  'never',
  'exceptZero',
]
const NOTATIONS: Array<NumberFormatOptions['notation']> = [
  'engineering',
  'scientific',
  'compact',
  'standard',
]

const COMPACT_DISPLAYS: Array<NumberFormatOptions['compactDisplay']> = [
  'long',
  'short',
]

const testCombos: Array<any[]> = SIGN_DISPLAYS.flatMap(signDisplay =>
  NOTATIONS.flatMap(notation =>
    COMPACT_DISPLAYS.map(compactDisplay => [
      notation,
      signDisplay,
      compactDisplay,
    ])
  )
)

export function test(locale: string, localeData?: any): void {
  describe(`Intl.NumberFormat ${locale}`, function () {
    beforeAll(function () {
      if (localeData) {
        NumberFormat.__addLocaleData(localeData)
      }
    })
    it.each(testCombos)(
      'notation=%s, signDisplay=%s, compactDisplay=%s',
      (notation, signDisplay, compactDisplay) => {
        const numberFormat = new NumberFormat(locale, {
          style: 'decimal',
          signDisplay,
          notation,
          compactDisplay,
        })
        expect(numberFormat.formatToParts(10000)).toMatchSnapshot()

        expect(numberFormat.formatRange(10000, 20000)).toMatchSnapshot()

        expect(numberFormat.formatRange(10000, 20000)).toMatchSnapshot()
      }
    )
  })
}
