import type {Unit} from './units.generated'
import {units} from './units.generated'

function isSupported(unit: Unit, locale: string = 'en'): boolean {
  try {
    const formatter = new Intl.NumberFormat(locale, {style: 'unit', unit})
    return formatter.resolvedOptions().unit === unit
  } catch (_err) {}

  return false
}

export function getSupportedUnits(locale?: string) {
  return units.filter(unit => isSupported(unit, locale))
}
