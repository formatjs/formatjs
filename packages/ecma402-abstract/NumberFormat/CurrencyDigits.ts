import {HasOwnProperty} from '#packages/ecma262-abstract/HasOwnProperty.js'

/**
 * https://tc39.es/ecma402/#sec-currencydigits
 */
export function CurrencyDigits(
  c: string,
  {currencyDigitsData}: {currencyDigitsData: Record<string, number>}
): number {
  return HasOwnProperty(currencyDigitsData, c)
    ? (currencyDigitsData as Record<string, number>)[c]
    : 2
}
