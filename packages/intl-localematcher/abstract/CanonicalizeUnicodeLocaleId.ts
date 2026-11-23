import {CanonicalizeLocaleList} from '#packages/intl-localematcher/abstract/CanonicalizeLocaleList.js'

export function CanonicalizeUnicodeLocaleId(locale: string): string {
  // ECMA-402 §9.2.6 steps 5 and 10: reuse the installed canonicalizer.
  return CanonicalizeLocaleList(locale)[0]
}
