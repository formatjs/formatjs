import {BestAvailableLocale} from './BestAvailableLocale.js'
import {UNICODE_EXTENSION_SEQUENCE_REGEX} from './utils.js'

/**
 * https://tc39.es/ecma402/#sec-lookupsupportedlocales
 * @param availableLocales
 * @param requestedLocales
 */
export function LookupSupportedLocales(
  availableLocales: string[],
  requestedLocales: string[]
): string[] {
  const subset: string[] = []
  for (const locale of requestedLocales) {
    const noExtensionLocale = locale.replace(
      UNICODE_EXTENSION_SEQUENCE_REGEX,
      ''
    )
    const availableLocale = BestAvailableLocale(
      availableLocales,
      noExtensionLocale
    )
    if (availableLocale) {
      subset.push(availableLocale)
    }
  }
  return subset
}
