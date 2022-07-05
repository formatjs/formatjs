import type {Unit} from './units.generated'
import {units} from './units.generated'

function isSupported(unit: Unit): boolean {
  try {
    const formatter = new Intl.NumberFormat('en', {style: 'unit', unit})
    return formatter.resolvedOptions().unit === unit
  } catch (_err) {}

  return false
}

export function getSupportedUnits() {
  return units.filter(isSupported)
}
