import {canonicalizeCountryCode} from './countryCodes.js'
import * as data from './defaultLocaleData.generated.json'

/**
 * Look up default locale for a country code.
 * @param countryCode country code (alpha-2)
 * @returns default locale, or en if not found
 */
export function defaultLocale(countryCode?: string): string {
  countryCode = canonicalizeCountryCode(countryCode)
  return (
    (countryCode && countryCode in data && data[countryCode as 'CN']) || 'en'
  )
}
