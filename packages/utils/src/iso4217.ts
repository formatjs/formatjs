import * as iso4217 from './currencyMinorUnits.generated.json' with {type: 'json'}

/**
 * Returns the number of minor units (decimal places) for a given currency code.
 *
 * @param currencyCode - The ISO 4217 currency code (e.g., 'USD', 'EUR').
 * @returns The number of minor units for the specified currency.
 * @throws Will throw an error if the currency code is unknown.
 */
function currencyMinorUnits(currencyCode: string): number {
  const minorUnits = iso4217[currencyCode.toUpperCase() as 'USD']
  if (minorUnits == null) {
    throw new Error(`Unknown currency code: ${currencyCode}`)
  }

  return minorUnits
}

/**
 * Returns the minor unit scale for a given currency code.
 *
 * The minor unit scale is the number of decimal places used for the currency.
 * For example, USD has 2 decimal places, so the minor unit scale is 100.
 *
 * @param currencyCode - The ISO 4217 currency code (e.g., 'USD', 'EUR').
 * @returns The minor unit scale as a power of 10.
 */
export function currencyMinorScale(currencyCode: string): number {
  return 10 ** currencyMinorUnits(currencyCode)
}
