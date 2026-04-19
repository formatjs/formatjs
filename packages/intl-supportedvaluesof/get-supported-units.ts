import {createMemoizedNumberFormat} from '#packages/ecma402-abstract/utils.js'
import type {Unit} from '@formatjs_generated/cldr.supported-values/units.js'
import {units} from '@formatjs_generated/cldr.supported-values/units.js'

/**
 * Implementation: Tests if a unit is supported by attempting to create
 * a NumberFormat with that unit and verifying it was accepted.
 *
 * CLDR Data: Candidate values come from CLDR unit types
 */
function isSupportedUnit(unit: Unit): boolean {
  try {
    // Always use 'en' for testing
    const formatter = createMemoizedNumberFormat('en', {style: 'unit', unit})
    return formatter.resolvedOptions().unit === unit
  } catch {}

  return false
}

/**
 * ECMA-402 Spec: Returns supported unit identifiers
 * ECMA-402 Spec: Results must be sorted lexicographically
 *
 * Implementation: Filters CLDR list against actual runtime support
 */
export function getSupportedUnits(): (
  | 'degree'
  | 'acre'
  | 'hectare'
  | 'percent'
  | 'bit'
  | 'byte'
  | 'gigabit'
  | 'gigabyte'
  | 'kilobit'
  | 'kilobyte'
  | 'megabit'
  | 'megabyte'
  | 'petabyte'
  | 'terabit'
  | 'terabyte'
  | 'day'
  | 'hour'
  | 'millisecond'
  | 'minute'
  | 'month'
  | 'second'
  | 'week'
  | 'year'
  | 'centimeter'
  | 'foot'
  | 'inch'
  | 'kilometer'
  | 'meter'
  | 'mile-scandinavian'
  | 'mile'
  | 'millimeter'
  | 'yard'
  | 'gram'
  | 'kilogram'
  | 'ounce'
  | 'pound'
  | 'stone'
  | 'celsius'
  | 'fahrenheit'
  | 'fluid-ounce'
  | 'gallon'
  | 'liter'
  | 'milliliter'
)[] {
  return units.filter(isSupportedUnit).sort()
}
