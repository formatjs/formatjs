import * as iso4217 from './currencyMinorUnits.generated.json'

/**
 * Returns the number of minor units (decimal places) for a given currency code.
 *
 * @param currencyCode - The ISO 4217 currency code (e.g., 'USD', 'EUR').
 * @returns The number of minor units for the specified currency.
 * @throws Will throw an error if the currency code is unknown.
 */
export function currencyMinorUnits(currencyCode: string): number {
  const minorUnits = iso4217[currencyCode.toUpperCase() as 'USD']
  if (minorUnits == null) {
    throw new Error(`Unknown currency code: ${currencyCode}`)
  }

  return minorUnits
}
