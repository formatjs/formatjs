import {numberingSystemNames} from './numbering-systems.generated'

function isSupportedNumberingSystem(system: string): boolean {
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

export function getSupportedNumberingSystems(): string[] {
  return numberingSystemNames.filter(isSupportedNumberingSystem)
}
