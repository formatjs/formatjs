import {canonicalizeCountryCode} from './countryCodes'
import * as data from './defaultCurrencyData.generated.json'

/**
 * Look up default currency for a country code.
 * @param countryCode country code (alpha-2)
 * @returns default currency code, or USD if not found
 */
export function defaultCurrency(countryCode?: string): string | undefined {
  countryCode = canonicalizeCountryCode(countryCode)
  return (
    (countryCode && countryCode in data && data[countryCode as 'US']) || 'USD'
  )
}
