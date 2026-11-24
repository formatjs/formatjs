import {RangeErrorConstructor} from '#packages/ecma262-abstract/intrinsics.js'
import {IsUnicodeLocaleIdentifierType} from '#packages/ecma402-abstract/IsUnicodeLocaleIdentifierType.js'
import {CanonicalizeLocaleList} from '#packages/ecma402-abstract/CanonicalizeLocaleList.js'
import {IsWellFormedCurrencyCode} from '#packages/ecma402-abstract/IsWellFormedCurrencyCode.js'
import {IsValidDateTimeFieldCode} from '#packages/ecma402-abstract/DisplayNames/IsValidDateTimeFieldCode.js'

const apply = Reflect.apply
const charCodeAt = String.prototype.charCodeAt
const indexOf = String.prototype.indexOf
const upperCase = String.prototype.toUpperCase
const lowerCase = String.prototype.toLowerCase
const slice = String.prototype.slice

// UTS 35 Part 1 defines the subtags. ECMA-402 also requires a well-formed
// language tag, so the initial subtag is a language and separators are hyphens.
// https://unicode.org/reports/tr35/tr35.html#unicode_language_id
function isDigit(code: number): boolean {
  return code >= 48 && code <= 57
}

function isLetter(code: number): boolean {
  const lower = code | 32
  return lower >= 97 && lower <= 122
}

function subtagMatches(
  code: string,
  start: number,
  end: number,
  matches: (code: number) => boolean
): boolean {
  for (let i = start; i < end; i++) {
    if (!matches(apply(charCodeAt, code, [i]) as number)) return false
  }
  return true
}

function isRegion(code: string, start: number, end: number): boolean {
  const length = end - start
  return (
    (length === 2 && subtagMatches(code, start, end, isLetter)) ||
    (length === 3 && subtagMatches(code, start, end, isDigit))
  )
}

function subtagEnd(code: string, start: number): number {
  const next = apply(indexOf, code, ['-', start]) as number
  return next < 0 ? code.length : next
}

function isLanguageId(code: string): boolean {
  let end = subtagEnd(code, 0)
  if (end < 2 || end === 4 || end > 8 || !subtagMatches(code, 0, end, isLetter))
    return false

  let start = end + 1
  end = subtagEnd(code, start)
  if (end - start === 4 && subtagMatches(code, start, end, isLetter)) {
    start = end + 1
    end = subtagEnd(code, start)
  }
  if (isRegion(code, start, end)) {
    start = end + 1
    end = subtagEnd(code, start)
  }
  while (start <= code.length) {
    const length = end - start
    if (length < 4 || length > 8) return false
    if (length === 4 && !isDigit(apply(charCodeAt, code, [start]) as number))
      return false
    if (!subtagMatches(code, start, end, isLetterOrDigit)) return false
    start = end + 1
    end = subtagEnd(code, start)
  }
  return true
}

function isLetterOrDigit(code: number): boolean {
  return isLetter(code) || isDigit(code)
}

// ECMA-402 §12.5.1 validates the whole code and regularizes its case.
// https://tc39.es/ecma402/#sec-canonicalcodefordisplaynames
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
    // Step 1 excludes extensions and private use, then canonicalizes aliases.
    if (!isLanguageId(code)) throw new RangeErrorConstructor('invalid language')
    return CanonicalizeLocaleList(code)[0]
  }
  if (type === 'region') {
    // Step 2 uppercases an ASCII region code.
    if (!isRegion(code, 0, code.length))
      throw new RangeErrorConstructor('invalid region')
    return apply(upperCase, code, [])
  }
  if (type === 'script') {
    // Step 3 titlecases a four-letter ASCII script code.
    if (code.length !== 4 || !subtagMatches(code, 0, 4, isLetter))
      throw new RangeErrorConstructor('invalid script')
    return (
      apply(upperCase, code[0], []) +
      apply(lowerCase, apply(slice, code, [1]), [])
    )
  }
  if (type === 'calendar') {
    // Step 4 requires a Unicode locale type with hyphen separators.
    if (!IsUnicodeLocaleIdentifierType(code))
      throw new RangeErrorConstructor('invalid calendar')
    return apply(lowerCase, code, [])
  }
  if (type === 'dateTimeField') {
    // Step 5 checks a case-sensitive Table 19 code.
    if (!IsValidDateTimeFieldCode(code))
      throw new RangeErrorConstructor('invalid dateTimeField')
    return code
  }
  // Steps 6–8 validate the currency before uppercasing it.
  if (!IsWellFormedCurrencyCode(code))
    throw new RangeErrorConstructor('invalid currency')
  return apply(upperCase, code, [])
}
