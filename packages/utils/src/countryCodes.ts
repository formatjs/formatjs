import alpha3CountryCodes from './iso3166Alpha3CountryCodes.json'

const COUNTRY_CODE_ALPHA2 = new Set(
  Object.keys(alpha3CountryCodes).map(
    key => alpha3CountryCodes[key as 'USA'] as string
  )
)

export function countryCodeAlpha3ToAlpha2(alpha3?: string): string | undefined {
  if (!alpha3) {
    return
  }
  const upper = alpha3.toUpperCase()
  // Lenient here, if it's already a 2 letter code, just return it
  if (alpha3.length === 2) {
    return COUNTRY_CODE_ALPHA2.has(upper) ? upper : undefined
  }
  return alpha3CountryCodes[upper as 'USA']
}
