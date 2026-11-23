import {CanonicalizeUnicodeLocaleId} from '#packages/intl-localematcher/abstract/CanonicalizeUnicodeLocaleId.js'
import {
  stringIndexOf,
  stringSlice,
} from '#packages/intl-localematcher/abstract/intrinsics.js'
import type {Keyword} from '#packages/intl-localematcher/abstract/types.js'
import {
  invariant,
  splitUnicodeExtension,
} from '#packages/intl-localematcher/abstract/utils.js'

export function InsertUnicodeExtensionAndCanonicalize(
  locale: string,
  attributes: string[],
  keywords: Array<Keyword>
): string {
  invariant(
    splitUnicodeExtension(locale).extension === undefined,
    'Expected locale to not have a Unicode locale extension'
  )
  let extension = '-u'
  // ECMA-402 §9.2.6 steps 3–4: append private attributes and fields in order.
  for (let i = 0; i < attributes.length; i++) {
    extension += `-${attributes[i]}`
  }
  for (let i = 0; i < keywords.length; i++) {
    const {key, value} = keywords[i]
    extension += `-${key}`
    if (value !== '') {
      extension += `-${value}`
    }
  }
  if (extension === '-u') {
    return CanonicalizeUnicodeLocaleId(locale)
  }
  // ECMA-402 §9.2.6 steps 6–8: insert before private-use subtags.
  let privateIndex = stringIndexOf(locale, '-x-')
  let newLocale
  if (privateIndex === -1) {
    newLocale = locale + extension
  } else {
    let preExtension = stringSlice(locale, 0, privateIndex)
    let postExtension = stringSlice(locale, privateIndex)
    newLocale = preExtension + extension + postExtension
  }
  return CanonicalizeUnicodeLocaleId(newLocale)
}
