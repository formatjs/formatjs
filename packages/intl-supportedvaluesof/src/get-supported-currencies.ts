import {createMemoizedNumberFormat} from '@formatjs/ecma402-abstract'
import type {Currency} from './currencies.generated.js'
import {currencies} from './currencies.generated.js'

/**
 * Implementation: Tests if a currency is supported by attempting to create
 * a NumberFormat with that currency and verifying it was accepted.
 *
 * CLDR Data: Candidate values come from CLDR currency codes (ISO 4217)
 */
function isSupportedCurrency(currency: Currency): boolean {
  try {
    // Always use 'en' for testing
    const numberFormat = createMemoizedNumberFormat('en', {
      style: 'currency',
      currencyDisplay: 'name',
      currency,
    })

    const format = numberFormat.format(123)

    if (
      format.substring(0, 3) !== currency &&
      format.substring(format.length - 3) !== currency
    ) {
      return true
    }
  } catch {}

  return false
}

/**
 * ECMA-402 Spec: Returns supported currency identifiers
 * ECMA-402 Spec: Results must be sorted lexicographically
 *
 * Implementation: Filters CLDR list against actual runtime support
 */
export function getSupportedCurrencies(): Currency[] {
  const ATOZ = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const supportedCurrencies: Currency[] = []

  for (const currency of currencies) {
    if (currency.length === 3) {
      if (isSupportedCurrency(currency)) {
        supportedCurrencies.push(currency)
      }
    } else if (currency.length === 5 && currency[3] === '~') {
      const start = ATOZ.indexOf(currency[2])
      const end = ATOZ.indexOf(currency[4])

      for (let i = start; i <= end; i++) {
        const currentCurrency = (currency.substring(0, 2) + ATOZ[i]) as Currency
        if (isSupportedCurrency(currentCurrency)) {
          supportedCurrencies.push(currentCurrency)
        }
      }
    }
  }

  return supportedCurrencies.sort()
}
