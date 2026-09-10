import {appendToList} from '#packages/intl-getcanonicallocales/appendToList.js'
import {
  type UnicodeLocaleId,
  type UnicodeLanguageId,
  type UnicodeExtension,
  type TransformedExtension,
  type PuExtension,
  type OtherExtension,
  type KV,
} from '#packages/intl-getcanonicallocales/types.js'

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
    const code = value.charCodeAt(i)
    if (!isLetter(code) && !(digits && isDigit(code))) return false
  }
  return true
}

function isUnicodeKey(value: string): boolean {
  return (
    value.length === 2 &&
    isSubtag(value, 2, 2, true) &&
    isLetter(value.charCodeAt(1))
  )
}

function isTransformedKey(value: string): boolean {
  return (
    value.length === 2 &&
    isLetter(value.charCodeAt(0)) &&
    isDigit(value.charCodeAt(1))
  )
}

function isOtherExtensionType(value: string): boolean {
  const type = value.toLowerCase()
  return (
    isSubtag(type, 1, 1, true) && type !== 't' && type !== 'u' && type !== 'x'
  )
}

export const SEPARATOR = '-'

export function isUnicodeLanguageSubtag(lang: string): boolean {
  return lang.length !== 4 && isSubtag(lang, 2, 8)
}

export function isStructurallyValidLanguageTag(tag: string): boolean {
  try {
    parseUnicodeLanguageId(tag.split(SEPARATOR))
  } catch {
    return false
  }
  return true
}

export function isUnicodeRegionSubtag(region: string): boolean {
  return (
    isSubtag(region, 2, 2) ||
    (region.length === 3 &&
      isDigit(region.charCodeAt(0)) &&
      isDigit(region.charCodeAt(1)) &&
      isDigit(region.charCodeAt(2)))
  )
}

export function isUnicodeScriptSubtag(script: string): boolean {
  return isSubtag(script, 4, 4)
}

export function isUnicodeVariantSubtag(variant: string): boolean {
  return (
    isSubtag(variant, 5, 8, true) ||
    (isSubtag(variant, 4, 4, true) && isDigit(variant.charCodeAt(0)))
  )
}

export function parseUnicodeLanguageId(
  chunks: string[] | string
): UnicodeLanguageId {
  if (typeof chunks === 'string') {
    chunks = chunks.split(SEPARATOR)
  }
  const lang = chunks.shift()
  if (!lang) {
    throw new RangeError('Missing unicode_language_subtag')
  }
  if (lang === 'root') {
    return {lang: 'root', variants: []}
  }
  // unicode_language_subtag
  if (!isUnicodeLanguageSubtag(lang)) {
    throw new RangeError('Malformed unicode_language_subtag')
  }
  let script
  // unicode_script_subtag
  if (chunks.length && isUnicodeScriptSubtag(chunks[0])) {
    script = chunks.shift()
  }
  let region
  // unicode_region_subtag
  if (chunks.length && isUnicodeRegionSubtag(chunks[0])) {
    region = chunks.shift()
  }
  const variants: Record<string, any> = {}
  while (chunks.length && isUnicodeVariantSubtag(chunks[0])) {
    const variant: string = chunks.shift()!
    if (variant in variants) {
      throw new RangeError(`Duplicate variant "${variant}"`)
    }
    variants[variant] = 1
  }
  return {
    lang,
    script,
    region,
    variants: Object.keys(variants),
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
    appendToList(attributes, chunks.shift()!)
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
  throw new RangeError('Malformed unicode_extension')
}

function parseKeyword(chunks: string[]): KV | undefined {
  let key
  if (!isUnicodeKey(chunks[0])) {
    return
  }
  key = chunks.shift()!

  const type: string[] = []
  while (chunks.length && isSubtag(chunks[0], 3, 8, true)) {
    appendToList(type, chunks.shift()!)
  }
  let value: string = ''
  if (type.length) {
    value = type.join(SEPARATOR)
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
    const key = chunks.shift()!
    const value: string[] = []
    while (chunks.length && isSubtag(chunks[0], 3, 8, true)) {
      appendToList(value, chunks.shift()!)
    }
    if (!value.length) {
      throw new RangeError(`Missing tvalue for tkey "${key}"`)
    }
    appendToList(fields, [key, value.join(SEPARATOR)])
  }
  if (lang || fields.length) {
    return {
      type: 't',
      fields,
      lang,
    }
  }
  throw new RangeError('Malformed transformed_extension')
}
function parsePuExtension(chunks: string[]): PuExtension {
  const exts: string[] = []
  while (chunks.length && isSubtag(chunks[0], 1, 8, true)) {
    appendToList(exts, chunks.shift()!)
  }
  if (exts.length) {
    return {
      type: 'x',
      value: exts.join(SEPARATOR),
    }
  }
  throw new RangeError('Malformed private_use_extension')
}
function parseOtherExtensionValue(chunks: string[]): string {
  const exts: string[] = []
  while (chunks.length && isSubtag(chunks[0], 2, 8, true)) {
    appendToList(exts, chunks.shift()!)
  }
  if (exts.length) {
    return exts.join(SEPARATOR)
  }
  // ECMA-402 §6.2.1, step 2: every extension singleton needs a value.
  // https://tc39.es/ecma402/#sec-iswellformedlanguagetag
  // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/locales-currencies-tz.html#L46
  throw new RangeError('Missing extension value')
}
function parseExtensions(chunks: string[]): Omit<UnicodeLocaleId, 'lang'> {
  if (!chunks.length) {
    return {extensions: []}
  }
  const extensions: UnicodeLocaleId['extensions'] = []
  let unicodeExtension
  let transformedExtension
  let puExtension
  const otherExtensionMap: Record<string, OtherExtension> = {}
  do {
    const type = chunks.shift()!.toLowerCase()
    switch (type) {
      case 'u':
      case 'U':
        if (unicodeExtension) {
          throw new RangeError('There can only be 1 -u- extension')
        }
        unicodeExtension = parseUnicodeExtension(chunks)
        appendToList(extensions, unicodeExtension)
        break
      case 't':
      case 'T':
        if (transformedExtension) {
          throw new RangeError('There can only be 1 -t- extension')
        }
        transformedExtension = parseTransformedExtension(chunks)
        appendToList(extensions, transformedExtension)
        break
      case 'x':
      case 'X':
        if (puExtension) {
          throw new RangeError('There can only be 1 -x- extension')
        }
        puExtension = parsePuExtension(chunks)
        appendToList(extensions, puExtension)
        break
      default:
        if (!isOtherExtensionType(type)) {
          throw new RangeError('Malformed extension type')
        }
        if (type in otherExtensionMap) {
          throw new RangeError(`There can only be 1 -${type}- extension`)
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
  const chunks = locale.split(SEPARATOR)
  const lang = parseUnicodeLanguageId(chunks)
  return {
    lang,
    ...parseExtensions(chunks),
  }
}
