import {BestAvailableLocale} from '#packages/intl-localematcher/abstract/BestAvailableLocale.js'
import {splitUnicodeExtension} from '#packages/intl-localematcher/abstract/utils.js'

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
    const {locale: noExtensionLocale} = splitUnicodeExtension(locale)
    const availableLocale = BestAvailableLocale(
      availableLocales,
      noExtensionLocale
    )
    if (availableLocale) {
      // ECMA-402 §9.2.9 FilterLocales, step 4.c: preserve the requested tag.
      // https://tc39.es/ecma402/#sec-filterlocales
      // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/negotiation.html#L344
      subset.push(locale)
    }
  }
  return subset
}
