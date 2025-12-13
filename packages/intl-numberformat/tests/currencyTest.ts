import {describe, it, beforeAll, expect} from 'vitest'
import {NumberFormatOptions} from '@formatjs/ecma402-abstract'
import '@formatjs/intl-pluralrules/polyfill'
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
  'standard',
]
const COMPACT_DISPLAYS: Array<NumberFormatOptions['compactDisplay']> = [
  'long',
  'short',
]

const CURRENCY_DISPLAYS: Array<NumberFormatOptions['currencyDisplay']> = [
  'code',
  'symbol',
  'name',
  'narrowSymbol',
]

const CURRENCY_SIGNS: Array<NumberFormatOptions['currencySign']> = [
  'accounting',
  'standard',
]

const CURRENCIES = ['USD', 'GBP', 'ZWD']

const testCombos: Array<any[]> = CURRENCIES.flatMap(currency =>
  CURRENCY_DISPLAYS.flatMap(currencyDisplay =>
    CURRENCY_SIGNS.flatMap(currencySign =>
      SIGN_DISPLAYS.flatMap(signDisplay =>
        NOTATIONS.flatMap(notation =>
          COMPACT_DISPLAYS.map(compactDisplay => [
            currency,
            currencyDisplay,
            currencySign,
            notation,
            signDisplay,
            compactDisplay,
          ])
        )
      )
    )
  )
)

export function test(locale: string, localeData?: any): void {
  describe(`Intl.NumberFormat '${locale}',`, function () {
    beforeAll(function () {
      if (localeData) {
        NumberFormat.__addLocaleData(localeData)
      }
    })
    it.each(testCombos)(
      'currency=%s, currencyDisplay=%s, currencySign=%s, signDisplay=%s, notation=%s, compactDisplay=%s',
      (
        currency,
        currencyDisplay,
        currencySign,
        notation,
        signDisplay,
        compactDisplay
      ) => {
        const nf = new NumberFormat(locale, {
          style: 'currency',
          currency,
          currencySign,
          currencyDisplay,
          signDisplay,
          notation,
          compactDisplay,
        })
        expect(nf.format(10000)).toMatchSnapshot()
        expect(nf.formatRange(10000, 100000)).toMatchSnapshot()
      }
    )
  })
}
