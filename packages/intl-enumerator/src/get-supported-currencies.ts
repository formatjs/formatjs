import type {Currency} from './currencies.generated'
import {currencies} from './currencies.generated'

function isSupportedCurrency(currency: Currency): boolean {
  try {
    const numberFormat = new Intl.NumberFormat('en', {
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
  } catch (_err) {}

  return false
}

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

  return supportedCurrencies
}
