import {getSupportedCalendars} from './get-supported-calendars.js'
import {getSupportedCollations} from './get-supported-collations.js'
import {getSupportedCurrencies} from './get-supported-currencies.js'
import {getSupportedNumberingSystems} from './get-supported-numbering-systems.js'
import {getSupportedTimeZones} from './get-supported-timezones.js'
import {getSupportedUnits} from './get-supported-units.js'

/**
 * ECMA-402 Spec: Intl.supportedValuesOf
 * https://tc39.es/ecma402/#sec-intl.supportedvaluesof
 */
declare global {
  namespace Intl {
    /**
     * Returns an array containing the supported values for the given key.
     * @param key - The category of values to return
     * @returns A sorted array of strings
     */
    function supportedValuesOf(
      key:
        | 'calendar'
        | 'collation'
        | 'currency'
        | 'numberingSystem'
        | 'timeZone'
        | 'unit'
    ): string[]
  }
}

/**
 * ECMA-402 Spec: Supported value categories
 */
export type SupportedValuesOf =
  | 'calendar'
  | 'collation'
  | 'currency'
  | 'numberingSystem'
  | 'timeZone'
  | 'unit'

/**
 * ECMA-402 Spec: Intl.supportedValuesOf(key)
 * https://tc39.es/ecma402/#sec-intl.supportedvaluesof
 *
 * Returns an array containing the supported calendar, collation, currency,
 * numbering systems, time zone, or unit values supported by the implementation.
 *
 * Implementation: We validate candidate values from CLDR against the actual
 * Intl formatters to determine runtime support rather than using static lists.
 * This ensures accuracy across different JavaScript engines and runtimes.
 *
 * @param key - The category of values to return
 * @returns A sorted array of unique string values
 */
export function supportedValuesOf(key: SupportedValuesOf): string[] {
  // ECMA-402 Spec: Dispatch to appropriate getter based on key
  switch (key) {
    case 'calendar':
      return getSupportedCalendars()
    case 'collation':
      return getSupportedCollations()
    case 'currency':
      return getSupportedCurrencies()
    case 'numberingSystem':
      return getSupportedNumberingSystems()
    case 'timeZone':
      return getSupportedTimeZones()
    case 'unit':
      return getSupportedUnits()
    default:
      // ECMA-402 Spec: Throw RangeError for invalid keys
      throw RangeError('Invalid key: ' + key)
  }
}
