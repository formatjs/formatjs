import {createMemoizedNumberFormat} from '@formatjs/ecma402-abstract'
import {numberingSystemNames} from './numbering-systems.generated'

function isSupportedNumberingSystem(
  system: string,
  locale: string = 'en'
): boolean {
  try {
    const numberFormat = createMemoizedNumberFormat(`${locale}-u-nu-${system}`)
    const options = numberFormat.resolvedOptions().numberingSystem

    if (
      (options === system && system === 'latn') ||
      numberFormat.format(123) !== '123'
    ) {
      return true
    }
  } catch {}

  return false
}

export function getSupportedNumberingSystems(locale?: string): string[] {
  return numberingSystemNames.filter(numberingSystemName =>
    isSupportedNumberingSystem(numberingSystemName, locale)
  )
}
