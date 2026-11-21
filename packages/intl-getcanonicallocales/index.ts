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

// Keep the original intrinsic when Intl.Locale is later replaced by a polyfill.
const originalLocaleToString =
  typeof Intl !== 'undefined' ? Intl.Locale?.prototype.toString : undefined

function localeString(value: unknown): string | undefined {
  if (
    value === null ||
    (typeof value !== 'object' && typeof value !== 'function')
  )
    return undefined
  // Probe the Locale brand without reading user properties or calling an own toString.
  // ECMA-402 §9.2.1 CanonicalizeLocaleList, steps 3–7.
  // https://tc39.es/ecma402/#sec-canonicalizelocalelist
  // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/negotiation.html#L51-L70
  const currentLocaleToString =
    typeof Intl !== 'undefined' ? Intl.Locale?.prototype.toString : undefined
  for (const method of [originalLocaleToString, currentLocaleToString]) {
    if (method) {
      try {
        const tag = method.call(value)
        if (typeof tag === 'string') return tag
      } catch {
        // The intrinsic rejects objects without its Locale internal slots.
      }
    }
  }
  return undefined
}

/**
 * ECMA-402 §9.2.1 CanonicalizeLocaleList, steps 3–7.
 * https://tc39.es/ecma402/#sec-canonicalizelocalelist
 * https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/negotiation.html#L51-L70
 */
function CanonicalizeLocaleList(
  locales?:
    | string[]
    | string
    | Intl.Locale
    | Intl.Locale[]
    | ArrayLike<string | Intl.Locale>
): string[] {
  if (locales === undefined) return []
  if (locales === null)
    throw new TypeErrorConstructor('Cannot convert null to an object')
  const singleLocale = localeString(locales)
  // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/negotiation.html#L54
  // L54: ToObject preserves objects and boxes primitives.
  const list = (
    typeof locales === 'string'
      ? [locales]
      : singleLocale !== undefined
        ? [singleLocale]
        : ToObject(locales)
  ) as {readonly length: unknown; readonly [index: number]: unknown}
  // LengthOfArrayLike performs ToLength: read once, coerce, truncate, and clamp.
  // ECMA-262 §7.3.18 LengthOfArrayLike, step 1.
  // https://tc39.es/ecma262/#sec-lengthofarraylike
  // https://github.com/tc39/ecma262/blob/dcf59856a8184792a9e42f0ffb7dc064094a5dcc/spec.html#L6576
  // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/negotiation.html#L55
  // L55: read length once, ToNumber, then truncate/clamp without mutable globals.
  const length = +(list.length as number)
  const len =
    length !== length
      ? 0
      : mathMin(mathMax(mathTrunc(length), 0), 9007199254740991)
  const seen: string[] = []
  for (let k = 0; k < len; k++) {
    if (!(k in list)) continue
    const value = list[k]
    // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/negotiation.html#L62
    // L62: accept String or Object, including undetectable host objects, without coercion.
    if (typeof value !== 'string' && !IsObject(value)) {
      throw new TypeErrorConstructor(
        'Locale list entries must be strings or objects'
      )
    }
    const tag = localeString(value) ?? ToString(value)
    const canonicalizedTag = emitUnicodeLocaleId(
      CanonicalizeUnicodeLocaleId(parseUnicodeLocaleId(tag))
    )
    if (arrayIndexOf(seen, canonicalizedTag) < 0)
      appendToList(seen, canonicalizedTag)
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
