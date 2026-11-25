import {
  addLocaleBrandReader,
  connectLocaleBrandReaders,
  getLocaleBrandReaders,
  localeBrandRegistry,
  localeString,
} from '#packages/intl-getcanonicallocales/locale-brand.js'
import {
  TypeErrorConstructor,
  arrayIndexOf,
  mathMax,
  mathMin,
  mathTrunc,
} from '#packages/ecma262-abstract/intrinsics.js'
import {IsObject} from '#packages/ecma262-abstract/IsObject.js'
import {ToObject} from '#packages/ecma262-abstract/ToObject.js'
import {appendToList} from '#packages/intl-getcanonicallocales/appendToList.js'
import {ToString} from '#packages/ecma262-abstract/ToString.js'
import {CanonicalizeUnicodeLocaleId} from '#packages/intl-getcanonicallocales/canonicalizer.js'
import {emitUnicodeLocaleId} from '#packages/intl-getcanonicallocales/emitter.js'
import {parseUnicodeLocaleId} from '#packages/intl-getcanonicallocales/parser.js'

type Locales = string | Intl.Locale | ArrayLike<string | Intl.Locale>

// ECMA-402 §9.2.1 CanonicalizeLocaleList.
// https://tc39.es/ecma402/#sec-canonicalizelocalelist
function CanonicalizeLocaleList(locales?: Locales): string[] {
  // Step 1 returns an empty list for undefined.
  if (locales === undefined) return []
  // Steps 3–4 wrap a single string or branded Locale, otherwise call ToObject.
  const singleLocale = localeString(locales)
  const list = (
    typeof locales === 'string'
      ? [locales]
      : singleLocale !== undefined
        ? [singleLocale]
        : ToObject(locales)
  ) as {readonly length: unknown; readonly [index: number]: unknown}
  // Step 5 reads and converts length once.
  // ECMA-262 §7.3.18 LengthOfArrayLike, step 1.
  // https://tc39.es/ecma262/#sec-lengthofarraylike
  const length = +(list.length as number)
  const len =
    length !== length
      ? 0
      : mathMin(mathMax(mathTrunc(length), 0), 9007199254740991)
  const seen: string[] = []
  // Steps 6–7 visit present indices in order and read each value once.
  for (let k = 0; k < len; k++) {
    if (!(k in list)) continue
    const value = list[k]
    // Step 7.c.ii accepts String and Object, including host-exotic objects.
    if (typeof value !== 'string' && !IsObject(value)) {
      throw new TypeErrorConstructor(
        'Locale list entries must be strings or objects'
      )
    }
    // Steps 7.c.iii–iv read the Locale slot or coerce the element to a string.
    const tag = localeString(value) ?? ToString(value)
    // Steps 7.c.v–vii validate, canonicalize, and keep the first occurrence.
    const canonicalizedTag = emitUnicodeLocaleId(
      CanonicalizeUnicodeLocaleId(parseUnicodeLocaleId(tag))
    )
    if (arrayIndexOf(seen, canonicalizedTag) < 0)
      appendToList(seen, canonicalizedTag)
  }
  return seen
}

// ECMA-262 §18: a built-in without [[Construct]] has no own prototype.
// https://tc39.es/ecma262/#sec-ecmascript-standard-built-in-objects
export const getCanonicalLocales: (locales?: Locales) => string[] = {
  getCanonicalLocales(locales?: Locales): string[] {
    // ECMA-402 §8.3.1 steps 1–2 canonicalize and return the fresh array.
    // https://tc39.es/ecma402/#sec-intl.getcanonicallocales
    return CanonicalizeLocaleList(locales)
  },
}.getCanonicalLocales

// Private setup capabilities for separately bundled FormatJS Locale packages.
Object.defineProperties(getCanonicalLocales, {
  __addLocaleBrandReader: {value: addLocaleBrandReader},
  __connectLocaleBrandReaders: {value: connectLocaleBrandReaders},
  __getLocaleBrandReaders: {value: getLocaleBrandReaders},
  __localeBrandRegistry: {value: localeBrandRegistry},
  __readLocaleTag: {value: localeString},
})

export * from '#packages/intl-getcanonicallocales/emitter.js'
export {
  isStructurallyValidLanguageTag,
  isUnicodeLanguageSubtag,
  isUnicodeRegionSubtag,
  isUnicodeScriptSubtag,
  isUnicodeVariantSubtag,
  parseUnicodeLanguageId,
  parseUnicodeLocaleId,
} from '#packages/intl-getcanonicallocales/parser.js'
export * from '#packages/intl-getcanonicallocales/types.js'

export * from '@formatjs_generated/cldr.core/likelySubtags.js'
