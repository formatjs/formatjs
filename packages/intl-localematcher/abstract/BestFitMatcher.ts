import type {LookupMatcherResult} from '#packages/intl-localematcher/abstract/types.js'
import {
  splitUnicodeExtension,
  findBestMatch,
} from '#packages/intl-localematcher/abstract/utils.js'

/**
 * https://tc39.es/ecma402/#sec-bestfitmatcher
 * @param availableLocales
 * @param requestedLocales
 * @param getDefaultLocale
 */
export function BestFitMatcher(
  availableLocales: readonly string[],
  requestedLocales: readonly string[],
  getDefaultLocale: () => string
): LookupMatcherResult {
  let foundLocale: string | undefined
  let extension: string | undefined
  const noExtensionLocales: string[] = []
  const noExtensionLocaleMap = requestedLocales.reduce<Record<string, string>>(
    (all, l) => {
      const {locale: noExtensionLocale} = splitUnicodeExtension(l)
      noExtensionLocales.push(noExtensionLocale)
      all[noExtensionLocale] = l
      return all
    },
    {}
  )

  const result = findBestMatch(noExtensionLocales, availableLocales)
  if (result.matchedSupportedLocale && result.matchedDesiredLocale) {
    foundLocale = result.matchedSupportedLocale
    extension = splitUnicodeExtension(
      noExtensionLocaleMap[result.matchedDesiredLocale]
    ).extension
  }

  if (!foundLocale) {
    return {locale: getDefaultLocale()}
  }

  return {
    locale: foundLocale,
    extension,
  }
}
