import {
  readLocaleTag,
  registerLocaleBrand,
} from '#packages/intl-locale/locale-brand.js'
import {IsObject} from '#packages/ecma262-abstract/IsObject.js'
import {ToString} from '#packages/ecma262-abstract/ToString.js'
import {
  arrayIndexOf,
  createFromConstructor,
  nullClassBase,
  numberFrom,
  RangeErrorConstructor,
  TypeErrorConstructor,
  setDataProperty,
} from '#packages/ecma262-abstract/intrinsics.js'
import {IsUnicodeLocaleIdentifierType} from '#packages/ecma402-abstract/IsUnicodeLocaleIdentifierType.js'
import {HasOwnProperty} from '#packages/ecma262-abstract/HasOwnProperty.js'
import {SameValue} from '#packages/ecma262-abstract/SameValue.js'
import {CoerceOptionsToObject} from '#packages/ecma402-abstract/CoerceOptionsToObject.js'
import {GetOption} from '#packages/ecma402-abstract/GetOption.js'
import {invariant} from '#packages/ecma402-abstract/utils.js'
import {supportedValuesOf} from '@formatjs/intl-supportedvaluesof'
import {
  type UnicodeExtension,
  type UnicodeLanguageId,
  emitUnicodeLanguageId,
  emitUnicodeLocaleId,
  getCanonicalLocales,
  isStructurallyValidLanguageTag,
  isUnicodeLanguageSubtag,
  isUnicodeRegionSubtag,
  isUnicodeScriptSubtag,
  isUnicodeVariantSubtag,
  likelySubtags,
  parseUnicodeLanguageId,
  parseUnicodeLocaleId,
} from '@formatjs/intl-getcanonicallocales'
import {scriptDirections} from '@formatjs_generated/cldr.locale/script-directions.js'
import getInternalSlots from '#packages/intl-locale/get_internal_slots.js'
import {
  getCalendarPreferenceDataForRegion,
  getHourCyclesPreferenceDataForLocaleOrRegion,
  getTimeZonePreferenceForRegion,
  getWeekDataForRegion,
} from '#packages/intl-locale/preference-data.js'

import type {WeekInfoInternal} from '#packages/intl-locale/preference-data.js'

const apply = Reflect.apply
const createObject = Object.create
const descriptor = Object.getOwnPropertyDescriptor
const getPrototypeOf = Object.getPrototypeOf
const objectPrototype = Object.prototype
const lowerCase = String.prototype.toLowerCase
const split = String.prototype.split
const slice = String.prototype.slice
const indexOf = String.prototype.indexOf
const join = Array.prototype.join

export interface IntlLocaleOptions {
  language?: string
  script?: string
  region?: string
  variants?: string
  calendar?: string
  collation?: string
  hourCycle?: 'h11' | 'h12' | 'h23' | 'h24'
  caseFirst?: 'upper' | 'lower' | 'false'
  numberingSystem?: string
  numeric?: boolean
  firstDayOfWeek?: string
}

const RELEVANT_EXTENSION_KEYS = [
  'ca',
  'co',
  'hc',
  'kf',
  'kn',
  'nu',
  'fw',
] as const
type RELEVANT_EXTENSION_KEY = (typeof RELEVANT_EXTENSION_KEYS)[number]
type ExtensionOpts = Record<RELEVANT_EXTENSION_KEY, string | undefined>

// ECMA-402 §15.4 https://tc39.es/ecma402/#sec-properties-of-intl-locale-instances
export interface IntlLocaleInternal extends IntlLocaleOptions {
  locale: string
  initializedLocale: boolean
}

function applyOptionsToTag(tag: string, options: IntlLocaleOptions): string {
  invariant(typeof tag === 'string', 'language tag must be a string')
  invariant(
    isStructurallyValidLanguageTag(tag),
    'malformed language tag',
    RangeErrorConstructor
  )
  // ECMA-402 §15.1.1, steps 13–14: canonicalize before applying overrides.
  // https://tc39.es/ecma402/#sec-Intl.Locale
  tag = getCanonicalLocales(tag)[0]
  const language = GetOption(
    options,
    'language',
    'string',
    undefined,
    undefined
  )
  if (language !== undefined) {
    invariant(
      isUnicodeLanguageSubtag(language),
      'Malformed unicode_language_subtag',
      RangeErrorConstructor
    )
  }
  const script = GetOption(options, 'script', 'string', undefined, undefined)
  if (script !== undefined) {
    invariant(
      isUnicodeScriptSubtag(script),
      'Malformed unicode_script_subtag',
      RangeErrorConstructor
    )
  }
  const region = GetOption(options, 'region', 'string', undefined, undefined)
  if (region !== undefined) {
    invariant(
      isUnicodeRegionSubtag(region),
      'Malformed unicode_region_subtag',
      RangeErrorConstructor
    )
  }
  // ECMA-402 §15.1.2 UpdateLanguageId, steps 8–9 and 14.
  // https://tc39.es/ecma402/#sec-updatelanguageid
  const variants = GetOption(
    options,
    'variants',
    'string',
    undefined,
    undefined
  )
  const languageId = parseUnicodeLanguageId(tag)
  if (variants !== undefined) {
    const subtags = apply(split, variants, ['-']) as string[]
    const seen = {__proto__: null} as unknown as Record<
      string,
      true | undefined
    >
    for (let index = 0; index < subtags.length; index++) {
      const original = subtags[index]
      if (!isUnicodeVariantSubtag(original)) {
        throw new RangeErrorConstructor('Malformed unicode_variant_subtag')
      }
      // Only validated ASCII subtags reach case folding.
      const variant = apply(lowerCase, original, []) as string
      if (seen[variant]) {
        throw new RangeErrorConstructor('Malformed unicode_variant_subtag')
      }
      seen[variant] = true
      subtags[index] = variant
    }
    languageId.variants = subtags
  }
  if (language !== undefined) {
    languageId.lang = language
  }
  if (script !== undefined) {
    languageId.script = script
  }
  if (region !== undefined) {
    languageId.region = region
  }
  return getCanonicalLocales(
    emitUnicodeLocaleId({
      ...parseUnicodeLocaleId(tag),
      lang: languageId,
    })
  )[0]
}

function findUnicodeExtension(
  extensions: ReturnType<typeof parseUnicodeLocaleId>['extensions']
): UnicodeExtension | undefined {
  for (let index = 0; index < extensions.length; index++) {
    const extension = extensions[index]
    if (extension.type === 'u') return extension
  }
}

function applyUnicodeExtensionToTag(
  tag: string,
  options: ExtensionOpts
): ExtensionOpts & {locale: string} {
  const ast = parseUnicodeLocaleId(tag)
  const extension = findUnicodeExtension(ast.extensions)
  const keywords = extension?.keywords ?? []

  // MakeLocaleRecord updates its private Unicode keyword list.
  // https://tc39.es/ecma402/#sec-makelocalerecord
  for (let index = 0; index < RELEVANT_EXTENSION_KEYS.length; index++) {
    const key = RELEVANT_EXTENSION_KEYS[index]
    const value = options[key]
    if (value === undefined) continue
    let position = 0
    while (position < keywords.length && keywords[position][0] !== key)
      position++
    if (position < keywords.length) {
      keywords[position][1] = value
    } else {
      setDataProperty(keywords, position, [key, value])
    }
  }

  if (!extension && keywords.length) {
    // Private use consumes following subtags. Insert Unicode data before it.
    const extensions: typeof ast.extensions = [
      {type: 'u', keywords, attributes: []},
    ]
    for (let index = 0; index < ast.extensions.length; index++) {
      setDataProperty(extensions, index + 1, ast.extensions[index])
    }
    ast.extensions = extensions
  }

  const result = createObject(null) as ExtensionOpts & {locale: string}
  result.locale = getCanonicalLocales(emitUnicodeLocaleId(ast))[0]
  // ECMA-402 §15.1.3 steps 4.e.i and 4.f store the canonical option values.
  // https://tc39.es/ecma402/#sec-makelocalerecord
  const canonical = findUnicodeExtension(
    parseUnicodeLocaleId(result.locale).extensions
  )?.keywords
  for (let index = 0; canonical && index < canonical.length; index++) {
    const keyword = canonical[index]
    if (HasOwnProperty(options, keyword[0]))
      result[keyword[0] as RELEVANT_EXTENSION_KEY] = keyword[1]
  }
  return result
}

function mergeUnicodeLanguageId(
  lang?: string,
  script?: string,
  region?: string,
  variants: string[] = [],
  replacement?: UnicodeLanguageId
): UnicodeLanguageId {
  if (!replacement) {
    return {
      lang: lang || 'und',
      script,
      region,
      variants,
    }
  }
  return {
    lang: !lang || lang === 'und' ? replacement.lang : lang,
    script: script || replacement.script,
    region: region || replacement.region,
    variants,
  }
}

function addLikelySubtags(tag: string): string {
  const ast = parseUnicodeLocaleId(tag)
  const {lang, variants} = ast.lang
  const script = ast.lang.script === 'Zzzz' ? undefined : ast.lang.script
  const region = ast.lang.region === 'ZZ' ? undefined : ast.lang.region
  // ECMA-402 §15.3.9, step 3; UTS 35 §4.3 Add Likely Subtags,
  // steps 1.2–1.4, 2, and 3: preserve supplied components and report no match.
  // https://tc39.es/ecma402/#sec-Intl.Locale.prototype.maximize
  // https://www.unicode.org/reports/tr35/tr35-78/tr35.html#Likely_Subtags
  // https://github.com/unicode-org/cldr/blob/acd6d88ae493633240e19a87a721076a8a75c310/docs/ldml/tr35.md#L2542-L2556
  if (lang !== 'und' && script && region) return tag
  const candidates = [
    {lang, script, region, variants: []},
    {lang, script, variants: []},
    {lang, region, variants: []},
    {lang, variants: []},
  ]
  for (let index = 0; index < candidates.length; index++) {
    const key = emitUnicodeLanguageId(candidates[index])
    if (!HasOwnProperty(likelySubtags, key)) continue
    const match = (likelySubtags as Readonly<Record<string, string>>)[key]
    ast.lang = mergeUnicodeLanguageId(
      lang,
      script,
      region,
      variants,
      parseUnicodeLanguageId(match)
    )
    return emitUnicodeLocaleId(ast)
  }
  return tag
}

/**
 * From: https://github.com/unicode-org/icu/blob/4231ca5be053a22a1be24eb891817458c97db709/icu4j/main/classes/core/src/com/ibm/icu/util/ULocale.java#L2395
 * @param tag
 */
function removeLikelySubtags(tag: string): string {
  let maxLocale = addLikelySubtags(tag)
  if (!maxLocale) {
    return tag
  }
  // ECMA-402 §15.3.10, step 3; UTS 35 §4.3 Remove Likely Subtags, steps 1–6.
  // Trials use maximized components, retaining the original variants/extensions.
  // https://tc39.es/ecma402/#sec-Intl.Locale.prototype.minimize
  // https://www.unicode.org/reports/tr35/tr35-78/tr35.html#Likely_Subtags
  // https://github.com/unicode-org/cldr/blob/acd6d88ae493633240e19a87a721076a8a75c310/docs/ldml/tr35.md#L2595-L2601
  const ast = parseUnicodeLocaleId(maxLocale)
  maxLocale = emitUnicodeLanguageId({
    ...parseUnicodeLanguageId(maxLocale),
    variants: [],
  })
  const {
    lang: {lang, script, region, variants},
  } = ast
  const trial = addLikelySubtags(emitUnicodeLanguageId({lang, variants: []}))
  if (trial === maxLocale) {
    return emitUnicodeLocaleId({
      ...ast,
      lang: mergeUnicodeLanguageId(lang, undefined, undefined, variants),
    })
  }
  if (region) {
    const trial = addLikelySubtags(
      emitUnicodeLanguageId({lang, region, variants: []})
    )
    if (trial === maxLocale) {
      return emitUnicodeLocaleId({
        ...ast,
        lang: mergeUnicodeLanguageId(lang, undefined, region, variants),
      })
    }
  }
  if (script) {
    const trial = addLikelySubtags(
      emitUnicodeLanguageId({lang, script, variants: []})
    )
    if (trial === maxLocale) {
      return emitUnicodeLocaleId({
        ...ast,
        lang: mergeUnicodeLanguageId(lang, script, undefined, variants),
      })
    }
  }
  return emitUnicodeLocaleId(ast)
}

function calendarsOfLocale(loc: Locale): Array<string> {
  const {calendar, locale} = getInternalSlots(loc)
  // ECMA-402 §15.5.9 step 1 returns the explicit calendar before region lookup.
  // https://tc39.es/ecma402/#sec-calendarsoflocale
  if (calendar !== undefined) return [calendar]

  const {region, regionOverride} = regionPreference(loc)

  const preferred = getCalendarPreferenceDataForRegion(
    region,
    regionOverride,
    parseUnicodeLanguageId(locale).lang
  )
  const available = supportedValuesOf('calendar')
  const result: string[] = []
  // Steps 7–11 canonicalize and retain supported preferences in order.
  for (let index = 0; index < preferred.length; index++) {
    // CLDR uses "gregorian" for the BCP 47 calendar identifier "gregory".
    const value =
      preferred[index] === 'gregorian' ? 'gregory' : preferred[index]
    const tag = getCanonicalLocales(`und-u-ca-${value}`)[0]
    const extension = parseUnicodeLocaleId(tag)
      .extensions[0] as UnicodeExtension
    const canonical = extension.keywords[0][1]
    if (
      arrayIndexOf(available, canonical) !== -1 &&
      arrayIndexOf(result, canonical) === -1
    ) {
      setDataProperty(result, result.length, canonical)
    }
  }
  return result.length ? result : ['gregory']
}

let formatterIntl = globalThis.Intl

function ownDataProperty(object: object, key: string) {
  const property = descriptor(object, key)
  return property && descriptor(property, 'value')
}

function formatterMethod(owner: unknown, name: string) {
  while (
    owner !== null &&
    (typeof owner === 'object' || typeof owner === 'function') &&
    owner !== objectPrototype
  ) {
    const method = ownDataProperty(owner, name)?.value
    if (typeof method === 'function') return method
    owner = getPrototypeOf(owner)
  }
}

// ECMA-402 §15.5.10 and §15.5.12 read formatter data through internal
// slots. Retain the operations used to query the host or installed provider.
function retainFormatter<K extends 'Collator' | 'NumberFormat'>(name: K) {
  type Constructor = (typeof Intl)[K]
  type Provider = {
    Constructor: Constructor
    supportedLocalesOf: Intl.CollatorConstructor['supportedLocalesOf']
    resolvedOptions: (...args: never[]) => any
  }
  const providers = new WeakMap<Constructor, Provider>()
  const get = providers.get.bind(providers)
  const set = providers.set.bind(providers)
  let current: Provider | undefined
  const read = () => {
    try {
      formatterIntl ??= ownDataProperty(globalThis, 'Intl')?.value
      const property = formatterIntl && ownDataProperty(formatterIntl, name)
      if (!property) return current
      const candidate = property.value
      if (typeof candidate !== 'function') return undefined
      const Constructor = candidate as Constructor
      let provider = get(Constructor)
      if (!provider) {
        const supportedLocalesOf = formatterMethod(
          Constructor,
          'supportedLocalesOf'
        )
        const resolvedOptions = formatterMethod(
          ownDataProperty(Constructor, 'prototype')?.value,
          'resolvedOptions'
        )
        if (
          typeof supportedLocalesOf !== 'function' ||
          typeof resolvedOptions !== 'function'
        )
          return undefined
        provider = {
          Constructor,
          supportedLocalesOf:
            supportedLocalesOf as Provider['supportedLocalesOf'],
          resolvedOptions: resolvedOptions as Provider['resolvedOptions'],
        }
        set(Constructor, provider)
      }
      current = provider
      return provider
    } catch {
      // An unavailable host formatter has no locale data to probe.
      return undefined
    }
  }
  read()
  return read
}
const readCollator = retainFormatter('Collator')
const readNumberFormat = retainFormatter('NumberFormat')

const lookupOptions = {__proto__: null, localeMatcher: 'lookup'} as const

function collationsOfLocale(loc: Locale): Array<string> {
  const {collation, locale} = getInternalSlots(loc)
  // ECMA-402 §15.5.10 steps 1–4 select explicit, matched, or fallback collations.
  // https://tc39.es/ecma402/#sec-collationsoflocale
  if (collation !== undefined) return [collation]
  try {
    const provider = readCollator()
    if (
      !provider ||
      !apply(provider.supportedLocalesOf, provider.Constructor, [
        [locale],
        lookupOptions,
      ]).length
    )
      return ['emoji', 'eor']

    const {Constructor, resolvedOptions} = provider
    const candidates = supportedValuesOf('collation')
    const result: string[] = []
    // supportedValuesOf already returns candidates in lexicographic order.
    for (let index = 0; index < candidates.length; index++) {
      const value = candidates[index]
      if (value === 'standard' || value === 'search') continue
      const options = {
        __proto__: null,
        localeMatcher: 'lookup',
        // The runtime list includes CLDR values missing from TypeScript's union.
        collation: value as Intl.CollatorOptions['collation'],
      } as const
      const formatter = new Constructor(locale, options)
      const optionsResult = apply(resolvedOptions, formatter, [])
      if (ownDataProperty(optionsResult, 'collation')?.value === value)
        setDataProperty(result, result.length, value)
    }
    return result
  } catch {
    return ['emoji', 'eor']
  }
}

function hourCyclesOfLocale(loc: Locale): Array<string> {
  const {hourCycle, locale} = getInternalSlots(loc)
  // ECMA-402 §15.5.11 step 1 returns the explicit hour cycle before region lookup.
  // https://tc39.es/ecma402/#sec-hourcyclesoflocale
  if (hourCycle !== undefined) return [hourCycle]

  const {region, regionOverride} = regionPreference(loc)

  return getHourCyclesPreferenceDataForLocaleOrRegion(
    parseUnicodeLanguageId(locale).lang,
    region,
    regionOverride
  )
}

function numberingSystemsOfLocale(loc: Locale): Array<string> {
  const {numberingSystem, locale} = getInternalSlots(loc)
  // ECMA-402 §15.5.12 steps 1–5 return the explicit system, matched
  // NumberFormat locale's default system, or latn when no locale matches.
  // https://tc39.es/ecma402/#sec-numberingsystemsoflocale
  if (numberingSystem !== undefined) return [numberingSystem]
  try {
    const provider = readNumberFormat()
    if (
      provider &&
      apply(provider.supportedLocalesOf, provider.Constructor, [
        [locale],
        lookupOptions,
      ]).length
    ) {
      const formatter = new provider.Constructor(locale, lookupOptions)
      const result = apply(provider.resolvedOptions, formatter, [])
      const system = ownDataProperty(result, 'numberingSystem')?.value
      if (typeof system === 'string') return [system]
    }
  } catch {
    // A partial host formatter may fail even after reporting a locale match.
  }
  return ['latn']
}

// ECMA-402 §15.5.13 https://tc39.es/ecma402/#sec-timezonesoflocale
function timeZonesOfLocale(loc: Locale): Array<string> | undefined {
  const locInternalSlots = getInternalSlots(loc)

  const locale = locInternalSlots.locale
  const region = parseUnicodeLanguageId(locale).region

  if (!region) {
    return undefined
  }

  return getTimeZonePreferenceForRegion(region)
}

// ECMA-402 §15.5.14 https://tc39.es/ecma402/#sec-textdirectionoflocale
function characterDirectionOfLocale(loc: Locale): string | undefined {
  // TextDirectionOfLocale 1–6: use the explicit script, otherwise likely script;
  // unknown or unoriented scripts return undefined. Extensions do not matter.
  // https://tc39.es/ecma402/#sec-textdirectionoflocale
  const locale = getInternalSlots(loc).locale
  let script = parseUnicodeLanguageId(locale).script
  if (script === undefined) {
    try {
      script = parseUnicodeLanguageId(addLikelySubtags(locale)).script
    } catch {
      return undefined
    }
  }
  return script && HasOwnProperty(scriptDirections, script)
    ? scriptDirections[script]
    : undefined
}

// ECMA-402 §15.5.6–7 extracts the Unicode keyword and canonicalizes its region.
// https://tc39.es/ecma402/#sec-unicodeextensionvalue
// https://tc39.es/ecma402/#sec-canonicalunicodesubdivision
function canonicalSubdivisionRegion(
  extension: UnicodeExtension | undefined,
  key: 'sd' | 'rg'
): string | undefined {
  const keywords = extension?.keywords
  if (!keywords) return undefined
  for (let index = 0; index < keywords.length; index++) {
    const keyword = keywords[index]
    if (keyword[0] !== key) continue
    const value = keyword[1]
    if (value === undefined) return undefined
    // The locale parser has already validated the ASCII type subtags.
    // A subdivision is one region prefix followed by 1–4 alphanumerics.
    if (apply(indexOf, value, ['-']) !== -1) return undefined
    let region = apply(slice, value, [0, 2]) as string
    if (!isUnicodeRegionSubtag(region)) {
      region = apply(slice, value, [0, 3]) as string
      if (!isUnicodeRegionSubtag(region)) return undefined
    }
    const suffixLength = value.length - region.length
    if (suffixLength < 1 || suffixLength > 4) return undefined
    const tag = getCanonicalLocales(`und-${region}`)[0]
    return parseUnicodeLanguageId(tag).region
  }
}

// ECMA-402 §15.5.8 steps 1–4 resolve the base region and independent override.
// https://tc39.es/ecma402/#sec-regionpreference
function regionPreference(loc: Locale): {
  region: string
  regionOverride: string | undefined
} {
  const {locale} = getInternalSlots(loc)
  const ast = parseUnicodeLocaleId(locale)
  const extension = findUnicodeExtension(ast.extensions)
  let region = ast.lang.region ?? canonicalSubdivisionRegion(extension, 'sd')
  if (region === undefined) {
    let maximal = locale
    try {
      maximal = addLikelySubtags(locale)
    } catch {
      // Step 2.b.i keeps the original tag if likely-subtag lookup fails.
    }
    region = parseUnicodeLanguageId(getCanonicalLocales(maximal)[0]).region
  }
  return {
    region: region ?? '001',
    regionOverride: canonicalSubdivisionRegion(extension, 'rg'),
  }
}

function weekInfoOfLocale(loc: Locale): WeekInfoInternal {
  const {region, regionOverride} = regionPreference(loc)
  return getWeekDataForRegion(region, regionOverride)
}

const TABLE_1 = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const

function weekdayToString(fw: string) {
  // WeekdayToUValue maps only exact numeric strings; other strings pass through.
  // ECMA-402 §15.5.15 WeekdayToUValue, steps 1–2, Table 26.
  // https://tc39.es/ecma402/#sec-weekdaytouvalue
  return fw.length === 1 && fw >= '0' && fw <= '7'
    ? TABLE_1[numberFrom(fw) % 7]
    : fw
}

// ECMA-402 §15.2 Constructor inherits Function.prototype.
// https://tc39.es/ecma402/#sec-properties-of-intl-locale-constructor
//
// ECMA-402 §15.2.1 https://tc39.es/ecma402/#sec-Intl.Locale.prototype
// ECMA-402 §15.3.1 https://tc39.es/ecma402/#sec-Intl.Locale.prototype.constructor
export class Locale extends nullClassBase {
  // @ts-expect-error TS2377: extends null and returns its own receiver.
  // oxlint-disable-next-line constructor-super -- The constructor returns its allocated receiver.
  constructor(tag: string | Locale, opts?: IntlLocaleOptions) {
    // ECMA-402 §15.1.1 uses NewTarget to allocate the branded receiver.
    // https://tc39.es/ecma402/#sec-Intl.Locale
    const receiver = createFromConstructor(new.target, Locale.prototype)
    if (tag === undefined) {
      throw new TypeErrorConstructor(
        "First argument to Intl.Locale constructor can't be empty or missing"
      )
    }

    if (typeof tag !== 'string') {
      if (!IsObject(tag))
        throw new TypeErrorConstructor('tag must be a string or object')
      // ECMA-402 §15.1.1, steps 7–9. Read [[Locale]] before trying string coercion.
      // https://tc39.es/ecma402/#sec-Intl.Locale
      tag = readLocaleTag(tag) ?? ToString(tag)
    }

    const internalSlots = getInternalSlots(receiver, true)

    // ECMA-402 §15.1.1 steps 10–14 coerce options before validating the tag.
    const options = CoerceOptionsToObject<IntlLocaleOptions>(opts)

    tag = applyOptionsToTag(tag, options)
    // Steps 15–34 validate each Unicode option before reading the next.
    const opt = createObject(null)
    const calendar = GetOption(
      options,
      'calendar',
      'string',
      undefined,
      undefined
    )
    if (calendar !== undefined) {
      if (!IsUnicodeLocaleIdentifierType(calendar)) {
        throw new RangeErrorConstructor('invalid calendar')
      }
    }
    opt.ca = calendar

    const collation = GetOption(
      options,
      'collation',
      'string',
      undefined,
      undefined
    )
    if (collation !== undefined) {
      if (!IsUnicodeLocaleIdentifierType(collation)) {
        throw new RangeErrorConstructor('invalid collation')
      }
    }
    opt.co = collation
    let fw = GetOption(
      options,
      'firstDayOfWeek',
      'string',
      undefined,
      undefined
    )
    if (fw !== undefined) {
      fw = weekdayToString(fw)
      if (!IsUnicodeLocaleIdentifierType(fw)) {
        throw new RangeErrorConstructor('Invalid firstDayOfWeek')
      }
    }
    // MakeLocaleRecord canonicalizes Unicode option values before storing them.
    // ECMA-402 §15.1.3 MakeLocaleRecord, step 4.e.i.
    // https://tc39.es/ecma402/#sec-makelocalerecord
    opt.fw = fw === undefined ? undefined : apply(lowerCase, fw, [])
    const hc = GetOption(
      options,
      'hourCycle',
      'string',
      ['h11', 'h12', 'h23', 'h24'],
      undefined
    )
    opt.hc = hc
    const kf = GetOption(
      options,
      'caseFirst',
      'string',
      ['upper', 'lower', 'false'],
      undefined
    )
    opt.kf = kf
    const numeric = GetOption(
      options,
      'numeric',
      'boolean',
      undefined,
      undefined
    )
    opt.kn = numeric === undefined ? undefined : ToString(numeric)
    const numberingSystem = GetOption(
      options,
      'numberingSystem',
      'string',
      undefined,
      undefined
    )
    if (numberingSystem !== undefined) {
      if (!IsUnicodeLocaleIdentifierType(numberingSystem)) {
        throw new RangeErrorConstructor('Invalid numberingSystem')
      }
    }
    opt.nu = numberingSystem
    const r = applyUnicodeExtensionToTag(tag, opt)
    internalSlots.locale = r.locale
    internalSlots.calendar = r.ca
    internalSlots.collation = r.co
    internalSlots.firstDayOfWeek = r.fw
    internalSlots.hourCycle = r.hc as 'h11'

    internalSlots.caseFirst = r.kf as 'upper'
    // An empty Unicode boolean keyword has the same meaning as 'true'.
    // ECMA-402 §15.1.1 steps 42.a–42.b.i.
    // https://tc39.es/ecma402/#sec-Intl.Locale
    internalSlots.numeric = r.kn === '' || SameValue(r.kn, 'true')
    internalSlots.numberingSystem = r.nu
    internalSlots.initializedLocale = true
    return receiver
  }

  /**
   * https://www.unicode.org/reports/tr35/#Likely_Subtags
   */
  public maximize(): Locale {
    const locale = getInternalSlots(this).locale
    try {
      const maximizedLocale = addLikelySubtags(locale)
      return new Locale(maximizedLocale)
    } catch {
      return new Locale(locale)
    }
  }

  /**
   * https://www.unicode.org/reports/tr35/#Likely_Subtags
   */
  public minimize(): Locale {
    const locale = getInternalSlots(this).locale
    try {
      const minimizedLocale = removeLikelySubtags(locale)
      return new Locale(minimizedLocale)
    } catch {
      return new Locale(locale)
    }
  }

  public toString(): string {
    // The intrinsic must reject uninitialized receivers before exposing [[Locale]].
    // ECMA-402 §15.3.15 Intl.Locale.prototype.toString, steps 2–3.
    // https://tc39.es/ecma402/#sec-Intl.Locale.prototype.toString
    const slots = getInternalSlots(this)
    if (!HasOwnProperty(slots, 'initializedLocale')) {
      throw new TypeErrorConstructor('Error uninitialized locale')
    }
    return slots.locale
  }

  // ECMA-402 §15.3.2 https://tc39.es/ecma402/#sec-Intl.Locale.prototype.baseName
  // ECMA-402 §15.5.1 https://tc39.es/ecma402/#sec-getlocalebasename
  public get baseName(): string {
    const locale = getInternalSlots(this).locale
    return emitUnicodeLanguageId(parseUnicodeLanguageId(locale))
  }

  public get calendar(): string | undefined {
    return getInternalSlots(this).calendar
  }

  // ECMA-402 §15.3.5 https://tc39.es/ecma402/#sec-Intl.Locale.prototype.collation
  public get collation(): string | undefined {
    return getInternalSlots(this).collation
  }

  // ECMA-402 §15.3.4 https://tc39.es/ecma402/#sec-Intl.Locale.prototype.caseFirst
  public get caseFirst(): 'upper' | 'lower' | 'false' | undefined {
    return getInternalSlots(this).caseFirst
  }

  // ECMA-402 §15.3.12 https://tc39.es/ecma402/#sec-Intl.Locale.prototype.numeric
  public get numeric(): boolean | undefined {
    return getInternalSlots(this).numeric
  }
  // ECMA-402 §15.3.11 https://tc39.es/ecma402/#sec-Intl.Locale.prototype.numberingSystem
  public get numberingSystem(): string | undefined {
    return getInternalSlots(this).numberingSystem
  }
  // ECMA-402 §15.3.8 https://tc39.es/ecma402/#sec-Intl.Locale.prototype.language
  // ECMA-402 §15.5.2 https://tc39.es/ecma402/#sec-getlocalelanguage
  public get language(): string {
    const locale = getInternalSlots(this).locale
    return parseUnicodeLanguageId(locale).lang
  }
  // ECMA-402 §15.3.14 https://tc39.es/ecma402/#sec-Intl.Locale.prototype.script
  // ECMA-402 §15.5.3 https://tc39.es/ecma402/#sec-getlocalescript
  public get script(): string | undefined {
    const locale = getInternalSlots(this).locale
    return parseUnicodeLanguageId(locale).script
  }
  // ECMA-402 §15.3.13 https://tc39.es/ecma402/#sec-Intl.Locale.prototype.region
  // ECMA-402 §15.5.4 https://tc39.es/ecma402/#sec-getlocaleregion
  public get region(): string | undefined {
    const locale = getInternalSlots(this).locale
    return parseUnicodeLanguageId(locale).region
  }

  /**
   * Returns the variant subtags of the locale, or undefined if none exist.
   * Multiple variants are joined with hyphens in alphabetical order.
   *
   * Added in ECMA-402 via PR #960 to align with other subtag accessors.
   * @see https://tc39.es/ecma402/#sec-Intl.Locale.prototype.variants
   * @see https://github.com/tc39/ecma402/pull/960
   * @see https://github.com/tc39/ecma402/issues/900
   */
  public get variants(): string | undefined {
    const locale = getInternalSlots(this).locale
    // ECMA-402 §15.5.5 steps 7–8 return the variant suffix or undefined.
    // https://tc39.es/ecma402/#sec-getlocalevariants
    const variants = parseUnicodeLanguageId(locale).variants
    if (!variants || variants.length === 0) {
      return undefined
    }
    return apply(join, variants, ['-'])
  }

  // ECMA-402 §15.3.6 https://tc39.es/ecma402/#sec-Intl.Locale.prototype.firstDayOfWeek
  public get firstDayOfWeek(): string | undefined {
    const internalSlots = getInternalSlots(this)
    if (!HasOwnProperty(internalSlots, 'initializedLocale')) {
      throw new TypeErrorConstructor('Error uninitialized locale')
    }
    return internalSlots.firstDayOfWeek
  }

  // ECMA-402 §15.3.7 https://tc39.es/ecma402/#sec-Intl.Locale.prototype.hourCycle
  public get hourCycle(): 'h11' | 'h12' | 'h23' | 'h24' | undefined {
    const internalSlots = getInternalSlots(this)
    if (!HasOwnProperty(internalSlots, 'initializedLocale')) {
      throw new TypeErrorConstructor('Error uninitialized locale')
    }
    return internalSlots.hourCycle
  }

  // ECMA-402 §15.3.16 https://tc39.es/ecma402/#sec-Intl.Locale.prototype.getCalendars
  public getCalendars(): string[] {
    return calendarsOfLocale(this)
  }

  // ECMA-402 §15.3.17 https://tc39.es/ecma402/#sec-Intl.Locale.prototype.getCollations
  public getCollations(): string[] {
    return collationsOfLocale(this)
  }

  // ECMA-402 §15.3.18 https://tc39.es/ecma402/#sec-Intl.Locale.prototype.getHourCycles
  public getHourCycles(): string[] {
    const internalSlots = getInternalSlots(this)
    if (!HasOwnProperty(internalSlots, 'initializedLocale')) {
      throw new TypeErrorConstructor('Error uninitialized locale')
    }

    return hourCyclesOfLocale(this)
  }

  // ECMA-402 §15.3.19 https://tc39.es/ecma402/#sec-Intl.Locale.prototype.getNumberingSystems
  public getNumberingSystems(): string[] {
    return numberingSystemsOfLocale(this)
  }

  // ECMA-402 §15.3.20 https://tc39.es/ecma402/#sec-Intl.Locale.prototype.getTimeZones
  public getTimeZones(): string[] | undefined {
    return timeZonesOfLocale(this)
  }

  // ECMA-402 §15.3.21 https://tc39.es/ecma402/#sec-Intl.Locale.prototype.getTextInfo
  public getTextInfo(): {
    direction: string | undefined
  } {
    return {direction: characterDirectionOfLocale(this)}
  }

  /**
   * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Locale/getWeekInfo
   * ECMA-402 §15.3.22 Intl.Locale.prototype.getWeekInfo, steps 3–7.
   * https://tc39.es/ecma402/#sec-Intl.Locale.prototype.getWeekInfo
   */
  public getWeekInfo(): {
    firstDay: number
    weekend: number[]
  } {
    const internalSlots = getInternalSlots(this)
    if (!HasOwnProperty(internalSlots, 'initializedLocale')) {
      throw new TypeErrorConstructor('Error uninitialized locale')
    }

    const wi = weekInfoOfLocale(this)
    const fw = internalSlots.firstDayOfWeek
    // WeekInfoOfLocale applies recognized weekday identifiers as ISO day numbers.
    // ECMA-402 §15.5.17 WeekInfoOfLocale, steps 8–9.b.
    // https://tc39.es/ecma402/#sec-weekinfooflocale
    // ECMA-402 §15.5.16 https://tc39.es/ecma402/#sec-weekdayuvaluetonumber
    const day = arrayIndexOf(TABLE_1, fw)
    const weekend: number[] = []
    for (let index = 0; index < wi.weekend.length; index++) {
      setDataProperty(weekend, index, wi.weekend[index])
    }
    return {firstDay: day === -1 ? wi.firstDay : day || 7, weekend}
  }

  // ECMA-402 §15.2.2 https://tc39.es/ecma402/#sec-intl.locale-internal-slots
  static relevantExtensionKeys: readonly [
    'ca',
    'co',
    'hc',
    'kf',
    'kn',
    'nu',
    'fw',
  ] = [...RELEVANT_EXTENSION_KEYS]
  public static readonly polyfilled = true
}

// ECMA-402 §15.3 Ordinary prototype inherits Object.prototype and has no instance slots.
// https://tc39.es/ecma402/#sec-properties-of-intl-locale-prototype-object
Object.setPrototypeOf(Locale.prototype, Object.prototype)

try {
  // ECMA-402 §15.3.24 https://tc39.es/ecma402/#sec-intl.locale.prototype-%symbol.tostringtag%
  if (typeof Symbol !== 'undefined') {
    Object.defineProperty(Locale.prototype, Symbol.toStringTag, {
      value: 'Intl.Locale',
      writable: false,
      enumerable: false,
      configurable: true,
    })
  }

  Object.defineProperty(Locale.prototype.constructor, 'length', {
    value: 1,
    writable: false,
    enumerable: false,
    configurable: true,
  })
} catch {
  // Meta fix so we're test262-compliant, not important
}

registerLocaleBrand(Locale)

export default Locale
