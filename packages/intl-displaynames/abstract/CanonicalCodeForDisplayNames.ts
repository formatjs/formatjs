import {
  CanonicalizeLocaleList,
  invariant,
  IsWellFormedCurrencyCode,
} from '@formatjs/ecma402-abstract'

import {IsValidDateTimeFieldCode} from './IsValidDateTimeFieldCode'

const UNICODE_REGION_SUBTAG_REGEX = /^([a-z]{2}|[0-9]{3})$/i
const ALPHA_4 = /^[a-z]{4}$/i
const UNICODE_TYPE_REGEX = /^[a-z0-9]{3,8}([-_][a-z0-9]{3,8})*$/i

function isUnicodeRegionSubtag(region: string): boolean {
  return UNICODE_REGION_SUBTAG_REGEX.test(region)
}

function isUnicodeScriptSubtag(script: string): boolean {
  return ALPHA_4.test(script)
}

function isUnicodeLocaleIdentifierType(code: string): boolean {
  return UNICODE_TYPE_REGEX.test(code)
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
    if (!isUnicodeLocaleIdentifierType(code)) {
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
