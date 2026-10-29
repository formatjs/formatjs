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
  const noExtensionLocaleMap: Record<string, string> = Object.create(null)
  const noExtensionLocales = requestedLocales.map(l => {
    const {locale: noExtensionLocale} = splitUnicodeExtension(l)
    noExtensionLocaleMap[noExtensionLocale] ??= l
    return noExtensionLocale
  })

  const defaultLocale = getDefaultLocale()
  const result = findBestMatch(
    noExtensionLocales,
    availableLocales,
    undefined,
    defaultLocale,
    false
  )
  if (result.matchedSupportedLocale && result.matchedDesiredLocale) {
    foundLocale = result.matchedSupportedLocale
    extension = splitUnicodeExtension(
      noExtensionLocaleMap[result.matchedDesiredLocale]
    ).extension
  }

  if (!foundLocale) {
    return {locale: defaultLocale}
  }

  return {
    locale: foundLocale,
    extension,
  }
}
