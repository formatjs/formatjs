import {LookupMatcherResult} from './types'
import {UNICODE_EXTENSION_SEQUENCE_REGEX, findBestMatch} from './utils'

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
  for (const l of requestedLocales) {
    const matchedLocale = findBestMatch(
      l.replace(UNICODE_EXTENSION_SEQUENCE_REGEX, ''),
      availableLocales
    )
    if (matchedLocale) {
      foundLocale = matchedLocale
      const noExtensionLocale = l.replace(UNICODE_EXTENSION_SEQUENCE_REGEX, '')
      extension = l.slice(noExtensionLocale.length, l.length) || undefined
      break
    }
  }
  if (!foundLocale) {
    return {locale: getDefaultLocale()}
  }

  return {
    locale: foundLocale,
    extension,
  }
}
