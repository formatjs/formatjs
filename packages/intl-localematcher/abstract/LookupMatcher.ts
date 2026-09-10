import {BestAvailableLocale} from '#packages/intl-localematcher/abstract/BestAvailableLocale.js'
import type {LookupMatcherResult} from '#packages/intl-localematcher/abstract/types.js'
import {splitUnicodeExtension} from '#packages/intl-localematcher/abstract/utils.js'

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
    const {locale: noExtensionLocale, extension} = splitUnicodeExtension(locale)
    const availableLocale = BestAvailableLocale(
      availableLocales,
      noExtensionLocale
    )
    if (availableLocale) {
      result.locale = availableLocale
      if (extension) result.extension = extension
      return result
    }
  }
  result.locale = getDefaultLocale()
  return result
}
