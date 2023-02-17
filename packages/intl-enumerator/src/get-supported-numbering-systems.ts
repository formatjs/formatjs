import {numberingSystemNames} from './numbering-systems.generated'

function isSupportedNumberingSystem(
  system: string,
  locale: string = 'en'
): boolean {
  try {
    const numberFormat = new Intl.NumberFormat(`${locale}-u-nu-${system}`)
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

export function getSupportedNumberingSystems(locale?: string): string[] {
  return numberingSystemNames.filter(numberingSystemName =>
    isSupportedNumberingSystem(numberingSystemName, locale)
  )
}
