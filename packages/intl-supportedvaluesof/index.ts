import {ToString} from '#packages/ecma262-abstract/ToString.js'
import {getSupportedCalendars} from '#packages/intl-supportedvaluesof/get-supported-calendars.js'
import {getSupportedCollations} from '#packages/intl-supportedvaluesof/get-supported-collations.js'
import {getSupportedCurrencies} from '#packages/intl-supportedvaluesof/get-supported-currencies.js'
import {getSupportedNumberingSystems} from '#packages/intl-supportedvaluesof/get-supported-numbering-systems.js'
import {getSupportedTimeZones} from '#packages/intl-supportedvaluesof/get-supported-timezones.js'
import {getSupportedUnits} from '#packages/intl-supportedvaluesof/get-supported-units.js'

export type {Calendar} from '@formatjs_generated/cldr.supported-values/calendars.js'
export type {Collation} from '@formatjs_generated/cldr.supported-values/collations.js'
export type {Currency} from '@formatjs_generated/cldr.supported-values/currencies.js'
export type {Timezone} from '@formatjs_generated/cldr.supported-values/timezones.js'
export type {Unit} from '@formatjs_generated/cldr.supported-values/units.js'

export {shouldPolyfill} from '#packages/intl-supportedvaluesof/should-polyfill.js'

/**
 * ECMA-402 Spec: Intl.supportedValuesOf
 * ECMA-402 §8.3.2 Intl.supportedValuesOf, step 1.
 * https://tc39.es/ecma402/#sec-intl.supportedvaluesof
 * https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/intl.html#L103
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
 * ECMA-402 §8.3.2 Intl.supportedValuesOf, step 1.
 * https://tc39.es/ecma402/#sec-intl.supportedvaluesof
 * https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/intl.html#L103
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
  // ECMA-402 §8.3.2 Intl.supportedValuesOf, step 1.
  // Coerce the key before dispatch: https://tc39.es/ecma402/#sec-intl.supportedvaluesof
  // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/intl.html#L103
  key = ToString(key) as SupportedValuesOf
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
