import {ToString} from '#packages/ecma262-abstract/ToString.js'
import {RangeErrorConstructor} from '#packages/ecma262-abstract/intrinsics.js'
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
 * ECMA-402 §8.3.2 Intl.supportedValuesOf.
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
 * ECMA-402 §8.3.2 Intl.supportedValuesOf.
 * https://tc39.es/ecma402/#sec-intl.supportedvaluesof
 *
 * Returns an array containing the supported calendar, collation, currency,
 * numbering systems, time zone, or unit values supported by the implementation.
 *
 * Units come from the spec. Other categories probe the installed formatters.
 *
 * @param key - The category of values to return
 * @returns A sorted array of unique string values
 */
// ECMA-262 §17, built-in function objects: non-constructors lack [[Construct]]
// and an own prototype property (these requirements are not algorithm steps).
// https://tc39.es/ecma262/#sec-ecmascript-standard-built-in-objects
export const supportedValuesOf: (key: SupportedValuesOf) => string[] = {
  supportedValuesOf(key: SupportedValuesOf): string[] {
    // Step 1 coerces the key before dispatch.
    key = ToString(key) as SupportedValuesOf
    // Steps 2–7 and 9 select the category and return its fresh array.
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
        // Step 8 throws for unrecognized keys.
        throw new RangeErrorConstructor('Invalid key: ' + key)
    }
  },
}.supportedValuesOf
