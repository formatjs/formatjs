import {createMemoizedNumberFormat} from '@formatjs/ecma402-abstract'
import type {Unit} from './units.generated.js'
import {units} from './units.generated.js'

function isSupported(unit: Unit, locale: string = 'en'): boolean {
  try {
    const formatter = createMemoizedNumberFormat(locale, {style: 'unit', unit})
    return formatter.resolvedOptions().unit === unit
  } catch {}

  return false
}

export function getSupportedUnits(
  locale?: string
): (
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
  return units.filter(unit => isSupported(unit, locale))
}
