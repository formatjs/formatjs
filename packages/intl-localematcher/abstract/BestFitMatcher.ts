import type {LookupMatcherResult} from './types.js'
import {UNICODE_EXTENSION_SEQUENCE_REGEX, findBestMatch} from './utils.js'

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
      const noExtensionLocale = l.replace(UNICODE_EXTENSION_SEQUENCE_REGEX, '')
      noExtensionLocales.push(noExtensionLocale)
      all[noExtensionLocale] = l
      return all
    },
    {}
  )

  const result = findBestMatch(noExtensionLocales, availableLocales)
  if (result.matchedSupportedLocale && result.matchedDesiredLocale) {
    foundLocale = result.matchedSupportedLocale
    extension =
      noExtensionLocaleMap[result.matchedDesiredLocale].slice(
        result.matchedDesiredLocale.length
      ) || undefined
  }

  if (!foundLocale) {
    return {locale: getDefaultLocale()}
  }

  return {
    locale: foundLocale,
    extension,
  }
}
