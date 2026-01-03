import {BestAvailableLocale} from './BestAvailableLocale.js'
import type {LookupMatcherResult} from './types.js'
import {UNICODE_EXTENSION_SEQUENCE_REGEX} from './utils.js'

/**
 * https://tc39.es/ecma402/#sec-lookupmatcher
 * @param availableLocales
 * @param requestedLocales
 * @param getDefaultLocale
 */
export function LookupMatcher(
  availableLocales: readonly string[],
  requestedLocales: readonly string[],
  getDefaultLocale: () => string
): LookupMatcherResult {
  const result: LookupMatcherResult = {locale: ''}
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
      result.locale = availableLocale
      if (locale !== noExtensionLocale) {
        result.extension = locale.slice(noExtensionLocale.length, locale.length)
      }
      return result
    }
  }
  result.locale = getDefaultLocale()
  return result
}
