import {BestAvailableLocale} from '#packages/intl-localematcher/abstract/BestAvailableLocale.js'
import type {LookupMatcherResult} from '#packages/intl-localematcher/abstract/types.js'
import {splitUnicodeExtension} from '#packages/intl-localematcher/abstract/utils.js'

/**
 * https://tc39.es/ecma402/#sec-lookupmatchinglocalebyprefix
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
  // ECMA-402 §9.2.3 step 1: visit the private List in order.
  for (let i = 0; i < requestedLocales.length; i++) {
    const locale = requestedLocales[i]
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
