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
  SEPARATOR,
} from '#packages/intl-getcanonicallocales/parser.js'
import {
  type Extension,
  type KV,
  type UnicodeLanguageId,
  type UnicodeLocaleId,
} from '#packages/intl-getcanonicallocales/types.js'

function canonicalizeAttrs(strs: string[]): string[] {
  return Object.keys(
    strs.reduce((all: Record<string, number>, str) => {
      all[str.toLowerCase()] = 1
      return all
    }, {})
  ).sort()
}

function canonicalizeKVs(arr: KV[], extension: 'u' | 't'): KV[] {
  const seen = new Set<string>()
  const result: KV[] = []
  // ECMA-402 §6.2.2, step 1 applies UTS #35 Processing LocaleIds, step 2.
  // Canonicalize aliases before removing Unicode "true" values; tvalues keep it.
  // https://tc39.es/ecma402/#sec-canonicalizeunicodelocaleid
  // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/locales-currencies-tz.html#L78-L81
  // https://unicode.org/reports/tr35/#processing-localeids
  // https://github.com/unicode-org/cldr/blob/acd6d88ae493633240e19a87a721076a8a75c310/docs/ldml/tr35.md#L4255-L4262
  for (const [rawKey, rawValue] of arr) {
    const key = rawKey.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    const value = rawValue?.toLowerCase() || ''
    let canonical = extensionAlias[extension]?.[key]?.[value] || value
    // ECMA-402 §6.2.2, step 1 applies UTS #35 Processing LocaleIds, step 3:
    // rg/sd use subdivision aliases, including territory replacements with zzzz.
    // https://tc39.es/ecma402/#sec-canonicalizeunicodelocaleid
    // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/locales-currencies-tz.html#L78-L81
    // https://unicode.org/reports/tr35/#processing-localeids
    // https://github.com/unicode-org/cldr/blob/acd6d88ae493633240e19a87a721076a8a75c310/docs/ldml/tr35.md#L4263-L4267
    if (extension === 'u' && (key === 'rg' || key === 'sd')) {
      canonical = subdivisionAlias[canonical] || canonical
    }
    result.push(
      !canonical || (extension === 'u' && canonical === 'true')
        ? [key]
        : [key, canonical]
    )
  }
  return result.sort(compareKV)
}

function compareKV(t1: Array<any>, t2: Array<any>): number {
  return t1[0] < t2[0] ? -1 : t1[0] > t2[0] ? 1 : 0
}

function compareExtension(e1: Extension, e2: Extension): number {
  return e1.type < e2.type ? -1 : e1.type > e2.type ? 1 : 0
}

function mergeVariants(v1: string[], v2: string[]): string[] {
  const result = [...v1]
  for (const v of v2) {
    if (v1.indexOf(v) < 0) {
      result.push(v)
    }
  }
  return result
}

interface LanguageAliasRule {
  type: UnicodeLanguageId
  replacement: UnicodeLanguageId
}

function compareLanguageAliasRules(a: LanguageAliasRule, b: LanguageAliasRule) {
  const fields = (id: UnicodeLanguageId) => [
    Number(id.lang !== 'und'),
    Number(!!id.script),
    Number(!!id.region),
    id.variants.length,
  ]
  const left = fields(a.type),
    right = fields(b.type)
  const difference =
    right.reduce((a, b) => a + b, 0) - left.reduce((a, b) => a + b, 0)
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
    const source = from.split(SEPARATOR)
    try {
      type = parseUnicodeLanguageId(source)
    } catch {
      return rules
    }
    if (source.length) return rules
    const target = to.split(SEPARATOR)
    const replacement = parseUnicodeLanguageId(target)
    if (target.length)
      throw new Error(`Invalid language alias replacement: ${to}`)
    rules.push({type, replacement})
    return rules
  }, [])
  .sort(compareLanguageAliasRules)
  .reduce((groups: Record<string, LanguageAliasRule[]>, rule) => {
    ;(groups[rule.type.lang] ||= []).push(rule)
    return groups
  }, Object.create(null))

export function canonicalizeUnicodeLanguageId(
  unicodeLanguageId: UnicodeLanguageId
): UnicodeLanguageId {
  // ECMA-402 §6.2.2, step 1: canonicalize case before matching CLDR aliases.
  // https://tc39.es/ecma402/#sec-canonicalizeunicodelocaleid
  // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/locales-currencies-tz.html#L78-L81
  unicodeLanguageId.lang = unicodeLanguageId.lang.toLowerCase()
  if (unicodeLanguageId.script) {
    unicodeLanguageId.script =
      unicodeLanguageId.script[0].toUpperCase() +
      unicodeLanguageId.script.slice(1).toLowerCase()
  }
  if (unicodeLanguageId.region) {
    unicodeLanguageId.region = unicodeLanguageId.region.toUpperCase()
  }
  unicodeLanguageId.variants = unicodeLanguageId.variants.map(v =>
    v.toLowerCase()
  )

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
    type.variants.every(variant => finalLangAst.variants.includes(variant))
  const languageRule = languageAliasRules[finalLangAst.lang]?.find(matches)
  const undRule =
    finalLangAst.lang === 'und'
      ? undefined
      : languageAliasRules.und?.find(matches)
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
      variants: mergeVariants(
        finalLangAst.variants.filter(v => !type.variants.includes(v)),
        replacement.variants
      ),
    }
    // Restart with the most specific rule after each replacement.
    return canonicalizeUnicodeLanguageId(finalLangAst)
  }

  if (finalLangAst.region) {
    const region = finalLangAst.region.toUpperCase()
    const regionAlias = territoryAlias[region]
    let replacedRegion: string | undefined
    if (regionAlias) {
      const regions = regionAlias.split(' ')
      replacedRegion = regions[0]
      const likelySubtag =
        likelySubtags[
          emitUnicodeLanguageId({
            lang: finalLangAst.lang,
            script: finalLangAst.script,
            variants: [],
          }) as 'aa'
        ]
      if (likelySubtag) {
        const {region: likelyRegion} = parseUnicodeLanguageId(
          likelySubtag.split(SEPARATOR)
        )
        if (likelyRegion && regions.indexOf(likelyRegion) > -1) {
          replacedRegion = likelyRegion
        }
      }
    }
    if (replacedRegion) {
      finalLangAst.region = replacedRegion
    }
    finalLangAst.region = finalLangAst.region.toUpperCase()
  }
  if (finalLangAst.script) {
    finalLangAst.script =
      finalLangAst.script[0].toUpperCase() +
      finalLangAst.script.slice(1).toLowerCase()
    if (scriptAlias[finalLangAst.script]) {
      finalLangAst.script = scriptAlias[finalLangAst.script]
    }
  }

  if (finalLangAst.variants.length) {
    for (let i = 0; i < finalLangAst.variants.length; i++) {
      let variant = finalLangAst.variants[i].toLowerCase()
      if (variantAlias[variant]) {
        const alias = variantAlias[variant]
        if (isUnicodeVariantSubtag(alias)) {
          finalLangAst.variants[i] = alias
        } else if (isUnicodeLanguageSubtag(alias)) {
          // Yes this can happen per the spec
          finalLangAst.lang = alias
        }
      }
    }
    finalLangAst.variants.sort()
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
    for (const extension of locale.extensions) {
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
          extension.value = extension.value.toLowerCase()
          break
      }
    }
    locale.extensions.sort(compareExtension)
  }

  return locale
}
