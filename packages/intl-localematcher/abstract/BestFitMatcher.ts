import {setDataProperty} from '#packages/intl-localematcher/abstract/intrinsics.js'
import type {LookupMatcherResult} from '#packages/intl-localematcher/abstract/types.js'
import {
  splitUnicodeExtension,
  findBestMatch,
} from '#packages/intl-localematcher/abstract/utils.js'

/**
 * https://tc39.es/ecma402/#sec-lookupmatchinglocalebybestfit
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
  const noExtensionLocaleMap = {__proto__: null} as unknown as Record<
    string,
    string
  >
  // ECMA-402 §9.2.4: strip extensions from the private requested locale List.
  const noExtensionLocales: string[] = []
  for (let index = 0; index < requestedLocales.length; index++) {
    const locale = requestedLocales[index]
    const {locale: noExtensionLocale} = splitUnicodeExtension(locale)
    noExtensionLocaleMap[noExtensionLocale] ??= locale
    setDataProperty(noExtensionLocales, `${index}`, noExtensionLocale)
  }

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
