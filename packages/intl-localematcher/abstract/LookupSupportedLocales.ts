import {BestAvailableLocale} from '#packages/intl-localematcher/abstract/BestAvailableLocale.js'
import {
  getAvailableLocaleList,
  getServiceLocaleList,
} from '#packages/intl-localematcher/abstract/ResolveLocale.js'
import {setDataProperty} from '#packages/intl-localematcher/abstract/intrinsics.js'
import {
  findBestMatch,
  splitUnicodeExtension,
} from '#packages/intl-localematcher/abstract/utils.js'

export function LookupSupportedLocales(
  availableLocales: string[],
  requestedLocales: string[]
): string[] {
  return FilterLocales(availableLocales, requestedLocales, 'lookup')
}

// ECMA-402 §9.2.9 steps 3–5 match each tag independently without a default.
// https://tc39.es/ecma402/#sec-filterlocales
export function FilterLocales(
  availableLocales: Set<string> | readonly string[],
  requestedLocales: readonly string[],
  matcher: 'lookup' | 'best fit',
  includeHostLocale = false
): string[] {
  const bestFit = matcher === 'best fit'
  const available = includeHostLocale
    ? getServiceLocaleList(availableLocales, bestFit).available
    : getAvailableLocaleList(availableLocales, bestFit)
  const subset: string[] = []
  for (let index = 0; index < requestedLocales.length; index++) {
    const locale = requestedLocales[index]
    const {locale: noExtensionLocale} = splitUnicodeExtension(locale)
    const availableLocale =
      matcher === 'lookup'
        ? BestAvailableLocale(available, noExtensionLocale)
        : findBestMatch(
            [noExtensionLocale],
            available,
            undefined,
            undefined,
            false
          ).matchedSupportedLocale
    if (availableLocale) {
      setDataProperty(subset, subset.length, locale)
    }
  }
  return subset
}
