import {
  CanonicalizeLocaleList,
  invariant,
  IsWellFormedCurrencyCode,
} from '@formatjs/ecma402-abstract'

const UNICODE_REGION_SUBTAG_REGEX = /^([a-z]{2}|[0-9]{3})$/i
const ALPHA_4 = /^[a-z]{4}$/i
function isUnicodeRegionSubtag(region: string): boolean {
  return UNICODE_REGION_SUBTAG_REGEX.test(region)
}

function isUnicodeScriptSubtag(script: string): boolean {
  return ALPHA_4.test(script)
}

export function CanonicalCodeForDisplayNames(
  type: 'language' | 'region' | 'script' | 'currency',
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
  invariant(type === 'currency', 'invalid type')
  if (!IsWellFormedCurrencyCode(code)) {
    throw RangeError('invalid currency')
  }
  return code.toUpperCase()
}
