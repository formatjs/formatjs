import {canonicalizeCountryCode} from './countryCodes.js'
import data from './defaultCurrencyData.generated.js'

const COUNTRIES_BY_DEFAULT_CURRENCY = Object.keys(data).reduce<
  Record<string, string[]>
>((acc, countryCode) => {
  const currencyCode = data[countryCode as 'US']
  if (!acc[currencyCode]) {
    acc[currencyCode] = []
  }
  acc[currencyCode].push(countryCode)
  return acc
}, {})

/**
 * Look up default currency for a country code.
 * @param countryCode country code (alpha-2)
 * @returns default currency code, or USD if not found
 */
export function defaultCurrency(countryCode?: string): string {
  countryCode = canonicalizeCountryCode(countryCode)
  return (
    (countryCode && countryCode in data && data[countryCode as 'US']) || 'USD'
  )
}

/**
 * Look up countries using a default currency.
 * @param currencyCode currency code (ISO 4217)
 * @returns list of country codes (alpha-2)
 */
export function countriesUsingDefaultCurrency(currencyCode?: string): string[] {
  return COUNTRIES_BY_DEFAULT_CURRENCY[currencyCode || 'USD'] || []
}
