import {appendToList} from '#packages/intl-getcanonicallocales/appendToList.js'
import {RangeErrorConstructor} from '#packages/ecma262-abstract/intrinsics.js'
import {
  type UnicodeLocaleId,
  type UnicodeLanguageId,
  type UnicodeExtension,
  type TransformedExtension,
  type PuExtension,
  type OtherExtension,
  type KV,
} from '#packages/intl-getcanonicallocales/types.js'

export const lowerCase = Function.prototype.call.bind(
  String.prototype.toLowerCase
) as (value: string) => string
const create = Object.create
const charCodeAt = Function.prototype.call.bind(
  String.prototype.charCodeAt
) as (value: string, index: number) => number
const indexOf = Function.prototype.call.bind(String.prototype.indexOf) as (
  value: string,
  separator: string,
  start: number
) => number
const slice = Function.prototype.call.bind(String.prototype.slice) as (
  value: string,
  start: number,
  end?: number
) => string
const shift = Function.prototype.call.bind(Array.prototype.shift) as (
  values: string[]
) => string | undefined
const join = Function.prototype.call.bind(Array.prototype.join) as (
  values: string[],
  separator: string
) => string

// ECMA-402 §6.2.1 steps 1–2 scan the private tag without invoking @@split.
// https://tc39.es/ecma402/#sec-iswellformedlanguagetag
export function splitSubtags(
  value: string,
  separator: '-' | ' ' = '-'
): string[] {
  const parts: string[] = []
  let start = 0
  let end = indexOf(value, separator, start)
  while (end !== -1) {
    appendToList(parts, slice(value, start, end))
    start = end + separator.length
    end = indexOf(value, separator, start)
  }
  appendToList(parts, slice(value, start))
  return parts
}

// ECMA-402 §6.2.1, step 2 validates ASCII locale grammar without observable
// RegExp execution, including changes to legacy RegExp constructor statics.
// https://tc39.es/ecma402/#sec-iswellformedlanguagetag
// https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/locales-currencies-tz.html#L46
function isLetter(code: number): boolean {
  return (code >= 65 && code <= 90) || (code >= 97 && code <= 122)
}

function isDigit(code: number): boolean {
  return code >= 48 && code <= 57
}

function isSubtag(
  value: string,
  min: number,
  max: number,
  digits = false
): boolean {
  if (value.length < min || value.length > max) return false
  for (let i = 0; i < value.length; i++) {
    const code = charCodeAt(value, i)
    if (!isLetter(code) && !(digits && isDigit(code))) return false
  }
  return true
}

function isUnicodeKey(value: string): boolean {
  return (
    value.length === 2 &&
    isSubtag(value, 2, 2, true) &&
    isLetter(charCodeAt(value, 1))
  )
}

function isTransformedKey(value: string): boolean {
  return (
    value.length === 2 &&
    isLetter(charCodeAt(value, 0)) &&
    isDigit(charCodeAt(value, 1))
  )
}

export const SEPARATOR = '-'

export function isUnicodeLanguageSubtag(lang: string): boolean {
  return lang.length !== 4 && isSubtag(lang, 2, 8)
}

export function isStructurallyValidLanguageTag(tag: string): boolean {
  try {
    parseUnicodeLocaleId(tag)
  } catch {
    return false
  }
  return true
}

export function isUnicodeRegionSubtag(region: string): boolean {
  return (
    isSubtag(region, 2, 2) ||
    (region.length === 3 &&
      isDigit(charCodeAt(region, 0)) &&
      isDigit(charCodeAt(region, 1)) &&
      isDigit(charCodeAt(region, 2)))
  )
}

export function isUnicodeScriptSubtag(script: string): boolean {
  return isSubtag(script, 4, 4)
}

export function isUnicodeVariantSubtag(variant: string): boolean {
  return (
    isSubtag(variant, 5, 8, true) ||
    (isSubtag(variant, 4, 4, true) && isDigit(charCodeAt(variant, 0)))
  )
}

export function parseUnicodeLanguageId(
  chunks: string[] | string
): UnicodeLanguageId {
  if (typeof chunks === 'string') {
    chunks = splitSubtags(chunks)
  }
  const lang = shift(chunks)
  if (!lang) {
    throw new RangeErrorConstructor('Missing unicode_language_subtag')
  }
  if (lang === 'root') {
    return {lang: 'root', variants: []}
  }
  // unicode_language_subtag
  if (!isUnicodeLanguageSubtag(lang)) {
    throw new RangeErrorConstructor('Malformed unicode_language_subtag')
  }
  let script
  // unicode_script_subtag
  if (chunks.length && isUnicodeScriptSubtag(chunks[0])) {
    script = shift(chunks)
  }
  let region
  // unicode_region_subtag
  if (chunks.length && isUnicodeRegionSubtag(chunks[0])) {
    region = shift(chunks)
  }
  const variants: string[] = []
  const seenVariants: Record<string, true> = create(null)
  while (chunks.length && isUnicodeVariantSubtag(chunks[0])) {
    const variant: string = shift(chunks)!
    // ECMA-402 §6.2.1 steps 1, 6.a and 11.g.i compare variants in ASCII lowercase.
    // https://tc39.es/ecma402/#sec-iswellformedlanguagetag
    const key = lowerCase(variant)
    if (seenVariants[key]) {
      throw new RangeErrorConstructor(`Duplicate variant "${variant}"`)
    }
    seenVariants[key] = true
    appendToList(variants, variant)
  }
  return {
    lang,
    script,
    region,
    variants,
  }
}

function parseUnicodeExtension(chunks: string[]): UnicodeExtension {
  const keywords: KV[] = []
  let keyword
  while (chunks.length && (keyword = parseKeyword(chunks))) {
    appendToList(keywords, keyword)
  }
  if (keywords.length) {
    return {
      type: 'u',
      keywords,
      attributes: [],
    }
  }
  // Mix of attributes & keywords
  // Check for attributes first
  const attributes: string[] = []
  while (chunks.length && isSubtag(chunks[0], 3, 8, true)) {
    appendToList(attributes, shift(chunks)!)
  }
  while (chunks.length && (keyword = parseKeyword(chunks))) {
    appendToList(keywords, keyword)
  }
  if (keywords.length || attributes.length) {
    return {
      type: 'u',
      attributes,
      keywords,
    }
  }
  throw new RangeErrorConstructor('Malformed unicode_extension')
}

function parseKeyword(chunks: string[]): KV | undefined {
  let key
  if (!isUnicodeKey(chunks[0])) {
    return
  }
  key = shift(chunks)!

  const type: string[] = []
  while (chunks.length && isSubtag(chunks[0], 3, 8, true)) {
    appendToList(type, shift(chunks)!)
  }
  let value: string = ''
  if (type.length) {
    value = join(type, SEPARATOR)
  }
  return [key, value]
}

function parseTransformedExtension(chunks: string[]): TransformedExtension {
  let lang: UnicodeLanguageId | undefined
  // ECMA-402 §6.2.1, step 2: transformed extensions allow a language,
  // fields, or both. Do not consume a field key as a failed language parse.
  // https://tc39.es/ecma402/#sec-iswellformedlanguagetag
  // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/locales-currencies-tz.html#L46
  if (chunks.length && isUnicodeLanguageSubtag(chunks[0])) {
    lang = parseUnicodeLanguageId(chunks)
  }
  const fields: KV[] = []
  while (chunks.length && isTransformedKey(chunks[0])) {
    const key = shift(chunks)!
    const value: string[] = []
    while (chunks.length && isSubtag(chunks[0], 3, 8, true)) {
      appendToList(value, shift(chunks)!)
    }
    if (!value.length) {
      throw new RangeErrorConstructor(`Missing tvalue for tkey "${key}"`)
    }
    appendToList(fields, [key, join(value, SEPARATOR)])
  }
  if (lang || fields.length) {
    return {
      type: 't',
      fields,
      lang,
    }
  }
  throw new RangeErrorConstructor('Malformed transformed_extension')
}
function parsePuExtension(chunks: string[]): PuExtension {
  const exts: string[] = []
  while (chunks.length && isSubtag(chunks[0], 1, 8, true)) {
    appendToList(exts, shift(chunks)!)
  }
  if (exts.length) {
    return {
      type: 'x',
      value: join(exts, SEPARATOR),
    }
  }
  throw new RangeErrorConstructor('Malformed private_use_extension')
}
function parseOtherExtensionValue(chunks: string[]): string {
  const exts: string[] = []
  while (chunks.length && isSubtag(chunks[0], 2, 8, true)) {
    appendToList(exts, shift(chunks)!)
  }
  if (exts.length) {
    return join(exts, SEPARATOR)
  }
  // ECMA-402 §6.2.1, step 2: every extension singleton needs a value.
  // https://tc39.es/ecma402/#sec-iswellformedlanguagetag
  // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/locales-currencies-tz.html#L46
  throw new RangeErrorConstructor('Missing extension value')
}
function parseExtensions(chunks: string[]): Omit<UnicodeLocaleId, 'lang'> {
  if (!chunks.length) {
    return {extensions: []}
  }
  const extensions: UnicodeLocaleId['extensions'] = []
  let unicodeExtension
  let transformedExtension
  let puExtension
  const otherExtensionMap: Record<string, OtherExtension> = create(null)
  do {
    const singleton = shift(chunks)!
    if (!isSubtag(singleton, 1, 1, true))
      throw new RangeErrorConstructor('Malformed extension type')
    const type = lowerCase(singleton)
    switch (type) {
      case 'u':
        if (unicodeExtension) {
          throw new RangeErrorConstructor('There can only be 1 -u- extension')
        }
        unicodeExtension = parseUnicodeExtension(chunks)
        appendToList(extensions, unicodeExtension)
        break
      case 't':
        if (transformedExtension) {
          throw new RangeErrorConstructor('There can only be 1 -t- extension')
        }
        transformedExtension = parseTransformedExtension(chunks)
        appendToList(extensions, transformedExtension)
        break
      case 'x':
        if (puExtension) {
          throw new RangeErrorConstructor('There can only be 1 -x- extension')
        }
        puExtension = parsePuExtension(chunks)
        appendToList(extensions, puExtension)
        break
      default:
        if (type in otherExtensionMap) {
          throw new RangeErrorConstructor(
            `There can only be 1 -${type}- extension`
          )
        }
        const extension: OtherExtension = {
          type: type as 'a',
          value: parseOtherExtensionValue(chunks),
        }
        otherExtensionMap[extension.type] = extension
        appendToList(extensions, extension)
        break
    }
  } while (chunks.length)
  return {extensions}
}

export function parseUnicodeLocaleId(locale: string): UnicodeLocaleId {
  const chunks = splitSubtags(locale)
  const lang = parseUnicodeLanguageId(chunks)
  // ECMA-402 §6.2.1 step 3 excludes UTS #35 backwards-compatible "root".
  // https://tc39.es/ecma402/#sec-iswellformedlanguagetag
  if (lang.lang === 'root')
    throw new RangeErrorConstructor('Invalid language tag: root')
  return {
    lang,
    ...parseExtensions(chunks),
  }
}
