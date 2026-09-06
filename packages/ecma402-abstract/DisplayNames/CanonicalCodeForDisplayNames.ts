import {IsUnicodeLocaleIdentifierType} from '#packages/ecma402-abstract/IsUnicodeLocaleIdentifierType.js'
import {CanonicalizeLocaleList} from '#packages/ecma402-abstract/CanonicalizeLocaleList.js'
import {IsWellFormedCurrencyCode} from '#packages/ecma402-abstract/IsWellFormedCurrencyCode.js'
import {invariant} from '#packages/ecma402-abstract/utils.js'

import {IsValidDateTimeFieldCode} from '#packages/ecma402-abstract/DisplayNames/IsValidDateTimeFieldCode.js'

const UNICODE_REGION_SUBTAG_REGEX = /^([a-z]{2}|[0-9]{3})$/i
const ALPHA_4 = /^[a-z]{4}$/i

function isUnicodeRegionSubtag(region: string): boolean {
  return UNICODE_REGION_SUBTAG_REGEX.test(region)
}

function isUnicodeScriptSubtag(script: string): boolean {
  return ALPHA_4.test(script)
}

export function CanonicalCodeForDisplayNames(
  type:
    | 'language'
    | 'region'
    | 'script'
    | 'calendar'
    | 'dateTimeField'
    | 'currency',
  code: string
): string {
  if (type === 'language') {
    return CanonicalizeLocaleList([code])[0]
  }
  if (type === 'region') {
    if (!isUnicodeRegionSubtag(code)) {
      throw RangeError('invalid region')
    }
    return code.toUpperCase()
  }
  if (type === 'script') {
    if (!isUnicodeScriptSubtag(code)) {
      throw RangeError('invalid script')
    }
    return `${code[0].toUpperCase()}${code.slice(1).toLowerCase()}`
  }
  if (type === 'calendar') {
    // CanonicalCodeForDisplayNames requires a Unicode type, excluding underscores.
    // ECMA-402 §12.5.1 CanonicalCodeForDisplayNames, steps 4.a–4.c.
    // https://tc39.es/ecma402/#sec-canonicalcodefordisplaynames
    // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/displaynames.html#L249-L251
    if (!IsUnicodeLocaleIdentifierType(code)) {
      throw RangeError('invalid calendar')
    }
    return code.toLowerCase()
  }
  if (type === 'dateTimeField') {
    if (!IsValidDateTimeFieldCode(code)) {
      throw RangeError('invalid dateTimeField')
    }
    return code
  }
  invariant(type === 'currency', 'invalid type')
  if (!IsWellFormedCurrencyCode(code)) {
    throw RangeError('invalid currency')
  }
  return code.toUpperCase()
}
