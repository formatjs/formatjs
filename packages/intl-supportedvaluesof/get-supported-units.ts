import {supportedEntries} from '#packages/intl-supportedvaluesof/supported-entries.js'
import type {Unit} from '@formatjs_generated/cldr.supported-values/units.js'
import {units} from '@formatjs_generated/cldr.supported-values/units.js'

// ECMA-402 §8.3.2 step 7 returns every sanctioned single unit in Table 2.
// https://tc39.es/ecma402/#sec-availablecanonicalunits
export function getSupportedUnits(): Unit[] {
  return supportedEntries(units, () => true)
}
