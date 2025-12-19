import alpha3CountryCodes from './iso3166Alpha3CountryCodes.js'

const COUNTRY_CODE_ALPHA2 = new Set(
  Object.keys(alpha3CountryCodes).map(
    key => alpha3CountryCodes[key as 'USA'] as string
  )
)

/**
 * Canonicalize a country code to a alpha2 country code (uppercase).
 * @param alpha3OrAlpha2 - 2 or 3 letter country code (case-insensitive)
 * @returns canonicalized 2 letter country code (uppercase) or undefined if not found
 */
export function canonicalizeCountryCode(
  alpha3OrAlpha2?: string
): string | undefined {
  if (!alpha3OrAlpha2) {
    return
  }
  const upper = alpha3OrAlpha2.toUpperCase()
  // Lenient here, if it's already a 2 letter code, just return it
  if (upper.length === 2) {
    return COUNTRY_CODE_ALPHA2.has(upper) ? upper : undefined
  }
  return alpha3CountryCodes[upper as 'USA']
}
