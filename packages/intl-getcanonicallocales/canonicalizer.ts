import {
  arrayEvery,
  arrayIncludes,
  arrayIndexOf,
} from '#packages/ecma262-abstract/intrinsics.js'
import {appendToList} from '#packages/intl-getcanonicallocales/appendToList.js'
import {
  extensionAlias,
  subdivisionAlias,
  languageAlias,
  scriptAlias,
  territoryAlias,
  variantAlias,
} from '@formatjs_generated/cldr.core/aliases.js'
import {emitUnicodeLanguageId} from '#packages/intl-getcanonicallocales/emitter.js'
import {likelySubtags} from '@formatjs_generated/cldr.core/likelySubtags.js'
import {
  isUnicodeLanguageSubtag,
  isUnicodeVariantSubtag,
  parseUnicodeLanguageId,
  lowerCase,
  splitSubtags,
} from '#packages/intl-getcanonicallocales/parser.js'
import {
  type Extension,
  type KV,
  type UnicodeLanguageId,
  type UnicodeLocaleId,
} from '#packages/intl-getcanonicallocales/types.js'

const create = Object.create
const keys = Object.keys
const hasOwn = Function.prototype.call.bind(
  Object.prototype.hasOwnProperty
) as (object: object, key: string) => boolean
const upperCase = Function.prototype.call.bind(
  String.prototype.toUpperCase
) as (value: string) => string
const slice = Function.prototype.call.bind(String.prototype.slice) as (
  value: string,
  start: number
) => string
const sort = Function.prototype.call.bind(Array.prototype.sort) as <T>(
  values: T[],
  compare?: (a: T, b: T) => number
) => T[]
const find = Function.prototype.call.bind(Array.prototype.find) as <T>(
  values: T[],
  predicate: (value: T) => boolean
) => T | undefined

function fromTable<T>(
  table: Readonly<Record<string, T>> | undefined,
  key: string
): T | undefined {
  return table && hasOwn(table, key) ? table[key] : undefined
}

function canonicalizeAttrs(strs: string[]): string[] {
  const seen: Record<string, true> = create(null)
  for (let i = 0; i < strs.length; i++) seen[lowerCase(strs[i])] = true
  return sort(keys(seen))
}

function canonicalizeKVs(arr: KV[], extension: 'u' | 't'): KV[] {
  const seen: Record<string, true> = create(null)
  const aliases = fromTable(extensionAlias, extension)
  const result: KV[] = []
  // ECMA-402 §6.2.2, step 1 applies UTS #35 Processing LocaleIds, step 2.
  // Canonicalize aliases before removing Unicode "true" values; tvalues keep it.
  // https://tc39.es/ecma402/#sec-canonicalizeunicodelocaleid
  // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/locales-currencies-tz.html#L78-L81
  // https://unicode.org/reports/tr35/#processing-localeids
  // https://github.com/unicode-org/cldr/blob/acd6d88ae493633240e19a87a721076a8a75c310/docs/ldml/tr35.md#L4255-L4262
  for (let i = 0; i < arr.length; i++) {
    const field = arr[i]
    const key = lowerCase(field[0])
    if (seen[key]) continue
    seen[key] = true
    const value = field.length === 2 ? lowerCase(field[1]) : ''
    let canonical = fromTable(fromTable(aliases, key), value) || value
    // ECMA-402 §6.2.2, step 1 applies UTS #35 Processing LocaleIds, step 3:
    // rg/sd use subdivision aliases, including territory replacements with zzzz.
    // https://tc39.es/ecma402/#sec-canonicalizeunicodelocaleid
    // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/locales-currencies-tz.html#L78-L81
    // https://unicode.org/reports/tr35/#processing-localeids
    // https://github.com/unicode-org/cldr/blob/acd6d88ae493633240e19a87a721076a8a75c310/docs/ldml/tr35.md#L4263-L4267
    if (extension === 'u' && (key === 'rg' || key === 'sd')) {
      canonical = fromTable(subdivisionAlias, canonical) || canonical
    }
    appendToList(
      result,
      !canonical || (extension === 'u' && canonical === 'true')
        ? [key]
        : [key, canonical]
    )
  }
  return sort(result, compareKV)
}

function compareKV(t1: KV, t2: KV): number {
  return t1[0] < t2[0] ? -1 : t1[0] > t2[0] ? 1 : 0
}

function compareExtension(e1: Extension, e2: Extension): number {
  // Private use consumes following subtags, so it must follow every extension.
  // https://tc39.es/ecma402/#sec-canonicalizeunicodelocaleid
  if (e1.type === 'x') return e2.type === 'x' ? 0 : 1
  if (e2.type === 'x') return -1
  return e1.type < e2.type ? -1 : e1.type > e2.type ? 1 : 0
}

function replaceVariants(
  source: string[],
  removed: string[],
  replacement: string[]
): string[] {
  const result: string[] = []
  for (let i = 0; i < source.length; i++) {
    const variant = source[i]
    if (!arrayIncludes(removed, variant)) appendToList(result, variant)
  }
  for (let i = 0; i < replacement.length; i++) {
    const variant = replacement[i]
    if (!arrayIncludes(result, variant)) appendToList(result, variant)
  }
  return result
}

interface LanguageAliasRule {
  type: UnicodeLanguageId
  replacement: UnicodeLanguageId
}

function compareLanguageAliasRules(a: LanguageAliasRule, b: LanguageAliasRule) {
  const fields = (id: UnicodeLanguageId) => [
    +(id.lang !== 'und'),
    +!!id.script,
    +!!id.region,
    id.variants.length,
  ]
  const left = fields(a.type),
    right = fields(b.type)
  let difference = 0
  for (let i = 0; i < left.length; i++) difference += right[i] - left[i]
  if (difference) return difference
  for (let i = 0; i < left.length; i++) {
    if (!!left[i] !== !!right[i]) return right[i] ? 1 : -1
  }
  const leftTag = emitUnicodeLanguageId(a.type),
    rightTag = emitUnicodeLanguageId(b.type)
  return leftTag < rightTag ? -1 : leftTag > rightTag ? 1 : 0
}

// UTS #35 Alias Rules: discard invalid language IDs, then prefer more
// specific matches. "und" represents an empty language field.
// https://unicode.org/reports/tr35/#preprocessing
// https://github.com/unicode-org/cldr/blob/acd6d88ae493633240e19a87a721076a8a75c310/docs/ldml/tr35.md#L4171-L4212
const languageAliasRules = Object.keys(languageAlias)
  .reduce<LanguageAliasRule[]>((rules, from) => {
    const to = languageAlias[from]
    let type: UnicodeLanguageId
    const source = splitSubtags(from)
    try {
      type = parseUnicodeLanguageId(source)
    } catch {
      return rules
    }
    if (source.length) return rules
    const target = splitSubtags(to)
    const replacement = parseUnicodeLanguageId(target)
    if (target.length)
      throw new Error(`Invalid language alias replacement: ${to}`)
    appendToList(rules, {type, replacement})
    return rules
  }, [])
  .sort(compareLanguageAliasRules)
  .reduce((groups: Record<string, LanguageAliasRule[]>, rule) => {
    appendToList((groups[rule.type.lang] ||= []), rule)
    return groups
  }, Object.create(null))

export function canonicalizeUnicodeLanguageId(
  unicodeLanguageId: UnicodeLanguageId
): UnicodeLanguageId {
  // ECMA-402 §6.2.2, step 1: canonicalize case before matching CLDR aliases.
  // https://tc39.es/ecma402/#sec-canonicalizeunicodelocaleid
  // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/locales-currencies-tz.html#L78-L81
  unicodeLanguageId.lang = lowerCase(unicodeLanguageId.lang)
  if (unicodeLanguageId.script) {
    unicodeLanguageId.script =
      upperCase(unicodeLanguageId.script[0]) +
      lowerCase(slice(unicodeLanguageId.script, 1))
  }
  if (unicodeLanguageId.region) {
    unicodeLanguageId.region = upperCase(unicodeLanguageId.region)
  }
  const lowerVariants: string[] = []
  for (let i = 0; i < unicodeLanguageId.variants.length; i++)
    appendToList(lowerVariants, lowerCase(unicodeLanguageId.variants[i]))
  unicodeLanguageId.variants = lowerVariants

  const original = emitUnicodeLanguageId(unicodeLanguageId)
  let finalLangAst = unicodeLanguageId
  // ECMA-402 §6.2.2, step 1 applies UTS #35 matching and replacement.
  // Remove matched subtags; retain fields that the rule does not replace.
  // https://tc39.es/ecma402/#sec-canonicalizeunicodelocaleid
  // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/locales-currencies-tz.html#L78-L81
  // https://unicode.org/reports/tr35/#4.-replacement
  // https://github.com/unicode-org/cldr/blob/acd6d88ae493633240e19a87a721076a8a75c310/docs/ldml/tr35.md#L4103-L4133
  const matches = ({type}: LanguageAliasRule) =>
    (!type.script || type.script === finalLangAst.script) &&
    (!type.region || type.region === finalLangAst.region) &&
    arrayEvery(type.variants, variant =>
      arrayIncludes(finalLangAst.variants, variant)
    )
  const rules = languageAliasRules[finalLangAst.lang]
  const languageRule = rules && find(rules, matches)
  const undRule =
    finalLangAst.lang !== 'und' && languageAliasRules.und
      ? find(languageAliasRules.und, matches)
      : undefined
  const matched = !languageRule
    ? undRule
    : !undRule
      ? languageRule
      : compareLanguageAliasRules(languageRule, undRule) <= 0
        ? languageRule
        : undRule
  if (matched) {
    const {type, replacement} = matched
    finalLangAst = {
      lang:
        type.lang !== 'und' || finalLangAst.lang === 'und'
          ? replacement.lang
          : finalLangAst.lang,
      script: type.script
        ? replacement.script
        : finalLangAst.script || replacement.script,
      region: type.region
        ? replacement.region
        : finalLangAst.region || replacement.region,
      variants: replaceVariants(
        finalLangAst.variants,
        type.variants,
        replacement.variants
      ),
    }
    // Restart with the most specific rule after each replacement.
    return canonicalizeUnicodeLanguageId(finalLangAst)
  }

  if (finalLangAst.region) {
    const region = upperCase(finalLangAst.region)
    const regionAlias = fromTable(territoryAlias, region)
    let replacedRegion: string | undefined
    if (regionAlias) {
      const regions = splitSubtags(regionAlias, ' ')
      replacedRegion = regions[0]
      // Territory replacement uses likely subtags: try language-script, then
      // language alone. A missing script-specific row must not skip fallback.
      // https://github.com/unicode-org/cldr/blob/acd6d88ae493633240e19a87a721076a8a75c310/docs/ldml/tr35.md#L4146
      // https://github.com/unicode-org/cldr/blob/acd6d88ae493633240e19a87a721076a8a75c310/docs/ldml/tr35.md#L2546-L2551
      const likelySubtag =
        fromTable(
          likelySubtags,
          emitUnicodeLanguageId({
            lang: finalLangAst.lang,
            script: finalLangAst.script,
            variants: [],
          })
        ) || fromTable(likelySubtags, finalLangAst.lang)
      if (likelySubtag) {
        const {region: likelyRegion} = parseUnicodeLanguageId(likelySubtag)
        if (likelyRegion && arrayIndexOf(regions, likelyRegion) > -1) {
          replacedRegion = likelyRegion
        }
      }
    }
    if (replacedRegion) {
      finalLangAst.region = replacedRegion
    }
    finalLangAst.region = upperCase(finalLangAst.region)
  }
  if (finalLangAst.script) {
    finalLangAst.script =
      upperCase(finalLangAst.script[0]) +
      lowerCase(slice(finalLangAst.script, 1))
    const alias = fromTable(scriptAlias, finalLangAst.script)
    if (alias) finalLangAst.script = alias
  }

  if (finalLangAst.variants.length) {
    for (let i = 0; i < finalLangAst.variants.length; i++) {
      const alias = fromTable(variantAlias, lowerCase(finalLangAst.variants[i]))
      if (alias) {
        if (isUnicodeVariantSubtag(alias)) {
          finalLangAst.variants[i] = alias
        } else if (isUnicodeLanguageSubtag(alias)) {
          // Yes this can happen per the spec
          finalLangAst.lang = alias
        }
      }
    }
    // UTS #35 Annex C treats variants as a sorted set after alias replacement.
    // https://unicode.org/reports/tr35/#processing-localeids
    const variants = sort(finalLangAst.variants)
    let count = 1
    for (let i = 1; i < variants.length; i++) {
      const variant = variants[i]
      if (variant !== variants[count - 1]) variants[count++] = variant
    }
    variants.length = count
  }
  return emitUnicodeLanguageId(finalLangAst) === original
    ? finalLangAst
    : canonicalizeUnicodeLanguageId(finalLangAst)
}

/**
 * Canonicalize based on
 * https://www.unicode.org/reports/tr35/tr35.html#Canonical_Unicode_Locale_Identifiers
 * https://tc39.es/ecma402/#sec-canonicalizeunicodelocaleid
 * IMPORTANT: This modifies the object inline
 * @param locale
 */
export function CanonicalizeUnicodeLocaleId(
  locale: UnicodeLocaleId
): UnicodeLocaleId {
  locale.lang = canonicalizeUnicodeLanguageId(locale.lang)
  if (locale.extensions) {
    for (let i = 0; i < locale.extensions.length; i++) {
      const extension = locale.extensions[i]
      switch (extension.type) {
        case 'u':
          extension.keywords = canonicalizeKVs(extension.keywords, 'u')
          if (extension.attributes) {
            extension.attributes = canonicalizeAttrs(extension.attributes)
          }
          break
        case 't':
          if (extension.lang) {
            extension.lang = canonicalizeUnicodeLanguageId(extension.lang)
          }
          extension.fields = canonicalizeKVs(extension.fields, 't')
          break
        default:
          extension.value = lowerCase(extension.value)
          break
      }
    }
    sort(locale.extensions, compareExtension)
  }

  return locale
}
