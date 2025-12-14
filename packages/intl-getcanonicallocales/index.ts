import {CanonicalizeUnicodeLocaleId} from './src/canonicalizer.js'
import {emitUnicodeLocaleId} from './src/emitter.js'
import {parseUnicodeLocaleId} from './src/parser.js'

/**
 * https://tc39.es/ecma402/#sec-canonicalizelocalelist
 * @param locales
 */
function CanonicalizeLocaleList(locales?: string[] | string): string[] {
  if (locales === undefined) {
    return []
  }
  const seen: string[] = []
  if (typeof locales === 'string') {
    locales = [locales]
  }
  for (const locale of locales) {
    const canonicalizedTag = emitUnicodeLocaleId(
      CanonicalizeUnicodeLocaleId(parseUnicodeLocaleId(locale))
    )
    if (seen.indexOf(canonicalizedTag) < 0) {
      seen.push(canonicalizedTag)
    }
  }
  return seen
}

export function getCanonicalLocales(locales?: string[] | string): string[] {
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
