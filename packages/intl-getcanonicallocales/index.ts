import {CanonicalizeUnicodeLocaleId} from './src/canonicalizer.js'
import {emitUnicodeLocaleId} from './src/emitter.js'
import {parseUnicodeLocaleId} from './src/parser.js'

/**
 * Check if value is an Intl.Locale object by checking for [[InitializedLocale]] internal slot
 * We detect this by checking if it's an Intl.Locale instance
 */
function isLocaleObject(value: any): value is Intl.Locale {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof value.toString === 'function' &&
    typeof value.baseName === 'string' &&
    typeof value.language === 'string'
  )
}

/**
 * https://tc39.es/ecma402/#sec-canonicalizelocalelist
 * @param locales
 */
function CanonicalizeLocaleList(
  locales?:
    | string[]
    | string
    | Intl.Locale
    | Intl.Locale[]
    | ArrayLike<string | Intl.Locale>
): string[] {
  // Step 1-2: If locales is undefined, return empty list
  if (locales === undefined) {
    return []
  }

  const seen: string[] = []

  // Step 3-4: Handle string or Locale object by wrapping in array
  if (typeof locales === 'string' || isLocaleObject(locales)) {
    locales = [locales as string | Intl.Locale]
  }

  // Step 5-6: Convert to object and get length for array-like objects
  const O = Object(locales)
  const len = typeof O.length === 'number' ? O.length : 0

  // Step 7: Iterate through elements
  for (let k = 0; k < len; k++) {
    // Check if property exists
    if (!(k in O)) {
      continue
    }

    const kValue = O[k]

    // Step 7c-d: Extract locale string
    let tag: string
    if (typeof kValue === 'string') {
      tag = kValue
    } else if (isLocaleObject(kValue)) {
      // For Intl.Locale objects, use toString() which returns the canonicalized locale
      tag = kValue.toString()
    } else {
      throw new TypeError(
        `Invalid locale type: expected string or Intl.Locale, got ${typeof kValue}`
      )
    }

    // Step 7e-g: Validate and canonicalize
    const canonicalizedTag = emitUnicodeLocaleId(
      CanonicalizeUnicodeLocaleId(parseUnicodeLocaleId(tag))
    )

    // Step 7h: Deduplicate
    if (seen.indexOf(canonicalizedTag) < 0) {
      seen.push(canonicalizedTag)
    }
  }

  return seen
}

export function getCanonicalLocales(
  locales?:
    | string[]
    | string
    | Intl.Locale
    | Intl.Locale[]
    | ArrayLike<string | Intl.Locale>
): string[] {
  return CanonicalizeLocaleList(locales)
}

export * from './src/emitter.js'
export {
  isStructurallyValidLanguageTag,
  isUnicodeLanguageSubtag,
  isUnicodeRegionSubtag,
  isUnicodeScriptSubtag,
  parseUnicodeLanguageId,
  parseUnicodeLocaleId,
} from './src/parser.js'
export * from './src/types.js'

export * from './src/likelySubtags.generated.js'
