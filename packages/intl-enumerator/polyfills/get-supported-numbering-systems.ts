import type {NumberingSystem} from '../data/numbering-systems'
import {numberingSystems} from '../data/numbering-systems'

function isSupportedNumberingSystem(system: NumberingSystem): boolean {
  try {
    const numberFormat = new Intl.NumberFormat('en-u-nu-' + system)
    const options = numberFormat.resolvedOptions().numberingSystem

    if (
      (options === system && system === 'latn') ||
      numberFormat.format(123) !== '123'
    ) {
      return true
    }
  } catch (_err) {}

  return false
}

export function getSupportedNumberingSystems(): NumberingSystem[] {
  return numberingSystems.filter(isSupportedNumberingSystem)
}
