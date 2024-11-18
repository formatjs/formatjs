import {CanonicalizeUnicodeLocaleId} from './CanonicalizeUnicodeLocaleId'
import {Keyword} from './types'
import {invariant} from './utils'

export function InsertUnicodeExtensionAndCanonicalize(
  locale: string,
  attributes: string[],
  keywords: Array<Keyword>
): string {
  invariant(
    locale.indexOf('-u-') === -1,
    'Expected locale to not have a Unicode locale extension'
  )
  let extension = '-u'
  for (const attr of attributes) {
    extension += `-${attr}`
  }
  for (const kw of keywords) {
    const {key, value} = kw
    extension += `-${key}`
    if (value !== '') {
      extension += `-${value}`
    }
  }
  if (extension === '-u') {
    return CanonicalizeUnicodeLocaleId(locale)
  }
  let privateIndex = locale.indexOf('-x-')
  let newLocale
  if (privateIndex === -1) {
    newLocale = locale + extension
  } else {
    let preExtension = locale.slice(0, privateIndex)
    let postExtension = locale.slice(privateIndex)
    newLocale = preExtension + extension + postExtension
  }
  return CanonicalizeUnicodeLocaleId(newLocale)
}
