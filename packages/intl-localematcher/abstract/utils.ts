import {CanonicalizeLocaleList} from '#packages/intl-localematcher/abstract/CanonicalizeLocaleList.js'
import {
  arrayIncludes,
  setDataProperty,
  splitLocaleSubtags,
  stringCharCodeAt,
  stringIndexOf,
  stringSlice,
} from '#packages/intl-localematcher/abstract/intrinsics.js'
import {memoize} from '@formatjs/fast-memoize'
import {matchingData} from '@formatjs_generated/cldr.core/matching.js'

const apply = Reflect.apply
const some = Array.prototype.some
const sortLocaleIndexes = Array.prototype.sort
const freezeLocaleList = Object.freeze
const LocaleError = Error
const LocaleMap = Map
const LocaleSet = Set
const addLocaleSet = Function.prototype.call.bind(LocaleSet.prototype.add) as (
  set: Set<string>,
  value: string
) => void
const hasLocaleSet = Function.prototype.call.bind(LocaleSet.prototype.has) as (
  set: ReadonlySet<string>,
  value: string
) => boolean
const minDistance = Math.min
const maxDistance = Math.max

// ECMA-402 §9.2.3, steps 1.b.i–ii: extract only the Unicode extension.
// A private-use subtag named "u" does not start a Unicode extension.
// https://tc39.es/ecma402/#sec-lookupmatchinglocalebyprefix
// https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/negotiation.html#L116-L118
export function splitUnicodeExtension(locale: string): {
  locale: string
  extension?: string
} {
  const subtags = splitLocaleSubtags(locale)
  for (let i = 1; i < subtags.length; i++) {
    if (subtags[i] === 'x') break
    if (subtags[i] !== 'u') continue
    let end = i + 1
    while (end < subtags.length && subtags[end].length > 1) end++
    let base = subtags[0]
    for (let j = 1; j < i; j++) base += '-' + subtags[j]
    for (let j = end; j < subtags.length; j++) base += '-' + subtags[j]
    let extension = ''
    for (let j = i; j < end; j++) extension += '-' + subtags[j]
    return {locale: base, extension}
  }
  // ECMA-402 §9.2.3 step 1.a: the private extension field starts empty.
  return {locale, extension: undefined}
}

/**
 * Asserts that a condition is true, throwing an error if it is not.
 * Used for runtime validation and type narrowing.
 *
 * @param condition - The condition to check
 * @param message - Error message if condition is false
 * @param Err - Error constructor to use (defaults to Error)
 * @throws {Error} When condition is false
 *
 * @example
 * ```ts
 * invariant(locale !== undefined, 'Locale must be defined')
 * // locale is now narrowed to non-undefined type
 * ```
 */
export function invariant(
  condition: boolean,
  message: string,
  Err: any = LocaleError
): asserts condition {
  if (!condition) {
    throw new Err(message)
  }
}

// ICU 78 defaults: language first, one-way matches enabled, region demotion.
const DEFAULT_MATCHING_THRESHOLD = matchingData.defaults[1]
const DISTANCE_SCALE = 8
const MIN_LSR_DISTANCE = matchingData.minLsrDistance
const languageAliases = new LocaleSet(matchingData.canonicalAliases.language)
const scriptAliases = new LocaleSet(matchingData.canonicalAliases.script)
const regionAliases = new LocaleSet(matchingData.canonicalAliases.region)

interface LSR {
  language: string
  script: string
  region: string
  flags: number
  key: string
  pseudo?: string
}

function ascii(
  value: string,
  start: number,
  end: number,
  min: number,
  max: number
): boolean {
  for (let i = start; i < end; i++) {
    const code = stringCharCodeAt(value, i)
    if (code < min || code > max) return false
  }
  return true
}

function languageSubtag(value: string): boolean {
  return (
    value.length >= 2 &&
    value.length <= 8 &&
    value.length !== 4 &&
    ascii(value, 0, value.length, 97, 122)
  )
}

function scriptSubtag(value: string): boolean {
  return (
    value.length === 4 &&
    ascii(value, 0, 1, 65, 90) &&
    ascii(value, 1, 4, 97, 122)
  )
}

function regionSubtag(value: string): boolean {
  return (
    (value.length === 2 && ascii(value, 0, 2, 65, 90)) ||
    (value.length === 3 && ascii(value, 0, 3, 48, 57))
  )
}

function pseudoRegion(value: string): boolean {
  return value === 'XA' || value === 'XB' || value === 'XC'
}

// ECMA-402 §9.2.4: parse the best-fit key using private String operations.
// ASCII parsing preserves legacy RegExp statics during Intl construction.
function prefix(tag: string): {
  language: string
  script: string
  region: string
  end: number
} {
  let end = stringIndexOf(tag, '-')
  if (end < 0) end = tag.length
  const language = stringSlice(tag, 0, end)
  let script = ''
  let region = ''
  if (end < tag.length) {
    let next = stringIndexOf(tag, '-', end + 1)
    if (next < 0) next = tag.length
    let part = stringSlice(tag, end + 1, next)
    if (scriptSubtag(part)) {
      script = part
      end = next
      next = stringIndexOf(tag, '-', end + 1)
      if (next < 0) next = tag.length
      part = stringSlice(tag, end + 1, next)
    }
    if (regionSubtag(part)) {
      region = part
      end = next
    }
  }
  return {language, script, region, end}
}

export function scriptlessRegionLocale(tag: string): string | undefined {
  const {language, script, region} = prefix(tag)
  if (script && region) return language + '-' + region
}

function fields(tag: string): LSR {
  const parsed = prefix(tag)
  const language = parsed.language
  let {script, region} = parsed
  const parts =
    parsed.end < tag.length
      ? splitLocaleSubtags(stringSlice(tag, parsed.end + 1))
      : []
  let pseudo: string | undefined
  for (let index = 0; index < parts.length; index++) {
    const part = parts[index]
    if (part.length === 1) break
    if (part === 'psaccent' || part === 'psbidi' || part === 'pscrack') {
      pseudo = part
      break
    }
  }
  if (!pseudo && !pseudoRegion(region)) {
    if (script === 'Zzzz') script = ''
    if (region === 'ZZ') region = ''
  }
  const flags =
    (language !== 'und' ? 4 : 0) |
    (script && script !== 'Zzzz' ? 2 : 0) |
    (region && region !== 'ZZ' ? 1 : 0)
  return {
    language,
    script,
    region,
    flags,
    pseudo,
    key:
      tag === 'und' || stringIndexOf(tag, 'und-x-') === 0
        ? tag
        : `${language}|${script}|${region}|${flags}|${pseudo || ''}`,
  }
}

const stringKey = (value: any): string => value
const canonicalize = memoize(
  (tag: string): string => {
    const basic = prefix(tag)
    if (
      basic.end === tag.length &&
      languageSubtag(basic.language) &&
      !hasLocaleSet(languageAliases, basic.language) &&
      !hasLocaleSet(scriptAliases, basic.script) &&
      !hasLocaleSet(regionAliases, basic.region)
    )
      return tag
    // ECMA-402 §9.2.4: reuse supplied locale canonicalization on the slow path.
    return CanonicalizeLocaleList(tag)[0]
  },
  {serializer: stringKey}
)
type LocaleField = 'language' | 'script' | 'region'
type LocaleFieldReader<K extends LocaleField> = (
  this: Intl.Locale
) => Intl.Locale[K]
type LocaleOperations = {
  maximize: Intl.Locale['maximize'] | undefined
} & {[K in LocaleField]: LocaleFieldReader<K> | undefined}

const localeDescriptor = Object.getOwnPropertyDescriptor
const localePrototype = Object.getPrototypeOf
const LocaleTypeError = TypeError
const localeOperations = new WeakMap<object, LocaleOperations>()
const getLocaleOperations = localeOperations.get.bind(localeOperations)
const setLocaleOperations = localeOperations.set.bind(localeOperations)
let localeIntl: typeof Intl | undefined = globalThis.Intl
let localeConstructor: typeof Intl.Locale | undefined

export function localeDescriptorMember(
  object: object,
  key: PropertyKey,
  member: 'value' | 'get' = 'value'
): unknown {
  const descriptor = localeDescriptor(object, key)
  return descriptor && localeDescriptor(descriptor, member)?.value
}

function localeFieldReader<K extends LocaleField>(
  prototype: object,
  key: K
): LocaleFieldReader<K> | undefined {
  const reader = localeDescriptorMember(prototype, key, 'get')
  return typeof reader === 'function'
    ? (reader as LocaleFieldReader<K>)
    : undefined
}

function captureLocaleOperations(
  prototype: object | null
): LocaleOperations | undefined {
  if (prototype === null) return undefined
  const cached = getLocaleOperations(prototype)
  if (cached) return cached
  const inherited = captureLocaleOperations(localePrototype(prototype))
  const ownMaximize = localeDescriptorMember(prototype, 'maximize')
  const operations: LocaleOperations = {
    maximize:
      typeof ownMaximize === 'function'
        ? (ownMaximize as Intl.Locale['maximize'])
        : inherited?.maximize,
    language: localeFieldReader(prototype, 'language') ?? inherited?.language,
    script: localeFieldReader(prototype, 'script') ?? inherited?.script,
    region: localeFieldReader(prototype, 'region') ?? inherited?.region,
  }
  setLocaleOperations(prototype, operations)
  return operations
}

function getLocaleConstructor(): typeof Intl.Locale | undefined {
  // A late data property can supply Intl.Locale after bootstrap.
  if (localeIntl === undefined) localeIntl = globalThis.Intl
  const installed = localeIntl && localeDescriptorMember(localeIntl, 'Locale')
  if (typeof installed === 'function' && installed !== localeConstructor) {
    const prototype = localeDescriptorMember(installed, 'prototype')
    if (
      (typeof prototype === 'object' && prototype !== null) ||
      typeof prototype === 'function'
    )
      captureLocaleOperations(prototype)
    localeConstructor = installed as typeof Intl.Locale
  }
  return localeConstructor
}

getLocaleConstructor()

function maximizeLocale(tag: string): Intl.Locale {
  // ECMA-402 §9.2.4 uses the existing maximize operation (§15.3.9 steps 2–4).
  const Constructor = getLocaleConstructor()
  if (!Constructor)
    throw new LocaleTypeError('Intl.Locale provider is unavailable')
  const locale = new Constructor(tag)
  const maximize = captureLocaleOperations(localePrototype(locale))?.maximize
  if (!maximize)
    throw new LocaleTypeError('Intl.Locale maximize is unavailable')
  return apply(maximize, locale, [])
}

function readLocaleField<K extends LocaleField>(
  locale: Intl.Locale,
  key: K
): Intl.Locale[K] {
  // §15.3.9 step 4 creates a base Locale, even for a derived receiver.
  // §§15.3.8, 15.3.13–14 step 3: read fields through its captured slot readers.
  const reader = captureLocaleOperations(localePrototype(locale))?.[key]
  return (reader && apply(reader, locale, [])) as Intl.Locale[K]
}

const maximal = memoize(
  (tag: string): LSR => {
    const input = fields(tag)
    // ICU keeps bare und, private-use locales and pseudolocales isolated.
    if (tag === 'und' || stringIndexOf(tag, 'und-x-') === 0) {
      return {
        ...input,
        language: tag,
        script: '',
        region: '',
        flags: 7,
        key: tag,
      }
    }
    const pseudo = pseudoRegion(input.region)
      ? input.region
      : input.pseudo === 'psaccent'
        ? 'XA'
        : input.pseudo === 'psbidi'
          ? 'XB'
          : input.pseudo === 'pscrack'
            ? 'XC'
            : undefined
    if (pseudo) {
      const language = `${pseudo}:${input.language}`
      const script = `${pseudo}:${input.script}`
      const region = input.region || pseudo
      const flags = input.region ? 7 : 6
      return {
        ...input,
        language,
        script,
        region,
        flags,
        key: `${language}|${script}|${region}|${flags}`,
      }
    }
    const locale = maximizeLocale(tag)
    let flags = input.flags
    if (arrayIncludes(matchingData.macroRegions, input.region)) {
      const regionLocale = maximizeLocale(`und-${input.region}`)
      if (
        (input.language === 'und' &&
          (!input.script ||
            input.script === readLocaleField(regionLocale, 'script'))) ||
        (!input.script &&
          !readLocaleField(maximizeLocale(input.language), 'script'))
      )
        flags &= ~1
    }
    let language = readLocaleField(locale, 'language')
    let script = readLocaleField(locale, 'script') || ''
    let region = readLocaleField(locale, 'region') || ''
    // Locale maximization can leave unknown tags incomplete; ICU matching fills them through und.
    if (language === 'und' || !script || !region) {
      const fallback = maximizeLocale(
        'und' + (script ? '-' + script : '') + (region ? '-' + region : '')
      )
      if (language === 'und')
        language =
          readLocaleField(fallback, 'language') === 'und'
            ? 'en'
            : readLocaleField(fallback, 'language')
      script ||= readLocaleField(fallback, 'script') || 'Latn'
      region ||= readLocaleField(fallback, 'region') || 'US'
    }
    return {
      language,
      script,
      region,
      flags,
      key: `${language}|${script}|${region}|${flags}`,
    }
  },
  {serializer: stringKey}
)

function rawKey(tag: string): string {
  if (tag === 'und') return '@und'
  if (stringIndexOf(tag, 'und-x-') === 0) return tag
  const parsed = prefix(tag)
  const base = stringSlice(tag, 0, parsed.end)
  if (pseudoRegion(parsed.region)) return base
  if (stringIndexOf(tag, '-ps') !== -1) {
    const input = fields(tag)
    if (input.pseudo) return input.key
  }
  if (parsed.script !== 'Zzzz' && parsed.region !== 'ZZ') return base
  const script = parsed.script === 'Zzzz' ? '' : parsed.script
  const region = parsed.region === 'ZZ' ? '' : parsed.region
  return (
    parsed.language +
    (script ? '-' + script : '') +
    (region ? '-' + region : '')
  )
}

const hasOwnMatchingKey = Function.prototype.call.bind(
  Object.prototype.hasOwnProperty
) as (table: object, key: string) => boolean

function matchingValue<T>(
  table: Record<string, T>,
  key: string
): T | undefined {
  return hasOwnMatchingKey(table, key) ? table[key] : undefined
}

function distance(desired: LSR, supported: LSR): number {
  // ECMA-402 §9.2.4: missing private CLDR entries use the generated defaults.
  const languages = `${desired.language}|${supported.language}`
  let result =
    desired.language === supported.language
      ? 0
      : (matchingValue(matchingData.language, languages) ??
        matchingData.defaults[0])
  if (desired.script !== supported.script) {
    result +=
      matchingValue(
        matchingData.script,
        `${languages}|${desired.script}|${supported.script}`
      ) ?? matchingData.defaults[1]
  }
  if (desired.region !== supported.region) {
    const matrix =
      matchingValue(
        matchingData.region,
        `${languages}|${desired.script}|${supported.script}`
      ) ?? matchingValue(matchingData.region, `${languages}|*|*`)
    const desiredPartitions = matchingValue(
      matchingData.regions,
      desired.region
    )
    const supportedPartitions = matchingValue(
      matchingData.regions,
      supported.region
    )
    let regionDistance = matchingData.defaults[2]
    if (matrix && desiredPartitions && supportedPartitions) {
      regionDistance = 0
      // Macroregions cover several partitions: ICU takes the worst pair.
      for (let i = 0; i < desiredPartitions.length; i++) {
        const row = desiredPartitions[i] * matchingData.partitionCount
        for (let j = 0; j < supportedPartitions.length; j++) {
          regionDistance = maxDistance(
            regionDistance,
            matrix[row + supportedPartitions[j]]
          )
        }
      }
    }
    result += regionDistance
  }
  return result === 0
    ? (desired.flags ^ supported.flags) / DISTANCE_SCALE
    : result
}

/** ICU language/script/region distance, including fractional explicit-subtag ties. */
export const findMatchingDistance: (
  desired: string,
  supported: string
) => number = memoize(
  (desired: string, supported: string): number =>
    distance(maximal(canonicalize(desired)), maximal(canonicalize(supported))),
  {serializer: (args: string[]) => `${args[0]}|${args[1]}`}
)

interface LocaleMatchingResult {
  distances: Record<string, Record<string, number>>
  matchedSupportedLocale?: string
  matchedDesiredLocale?: string
}
interface Supported {
  original: readonly string[]
  tags: string[]
  raw: Map<string, number>
  maximal?: LSR[]
  exact?: Map<string, number>
  orders: Map<string, number[]>
  best: Map<string, {index: number; distance: number}>
}
const supportedCache = new WeakMap<readonly string[], Supported>()
const getSupported = supportedCache.get.bind(supportedCache)
const setSupported = supportedCache.set.bind(supportedCache)
const immutableLocaleLists = new WeakSet<readonly string[]>()
const markLocaleListImmutable =
  immutableLocaleLists.add.bind(immutableLocaleLists)
const isLocaleListImmutable =
  immutableLocaleLists.has.bind(immutableLocaleLists)
let paradigms: Set<string> | undefined

export function createLocaleListSnapshot(
  locales: readonly string[],
  additionalLocales: readonly string[] = []
): readonly string[] {
  // ECMA-402 §9.2.7 step 2.a: snapshot the private available locale List.
  const snapshot: string[] = []
  for (let index = 0; index < locales.length; index++) {
    setDataProperty(snapshot, `${index}`, locales[index])
  }
  for (let index = 0; index < additionalLocales.length; index++) {
    setDataProperty(snapshot, `${snapshot.length}`, additionalLocales[index])
  }
  markLocaleListImmutable(freezeLocaleList(snapshot))
  return snapshot
}

function equivalentKey(lsr: LSR): string {
  return `${lsr.language}|${lsr.script}|${lsr.region}`
}

function prepare(locales: readonly string[]): Supported {
  // Frozen caller arrays may have getters; only our own snapshots are stable.
  const immutable = isLocaleListImmutable(locales)
  let result = getSupported(locales)
  if (
    result &&
    !immutable &&
    (result.original.length !== locales.length ||
      apply(some, result.original, [
        (tag: string, index: number) => tag !== locales[index],
      ]))
  )
    result = undefined
  if (!result) {
    // ECMA-402 §9.2.7 step 2.a: keep the prepared locale profile private.
    result = {
      __proto__: null,
      original: immutable ? locales : Array.from(locales),
      tags: [],
      raw: new LocaleMap(),
      orders: new LocaleMap(),
      best: new LocaleMap(),
    } as Supported
    setSupported(locales, result)
  }
  return result
}

const getLocaleMap = Function.prototype.call.bind(LocaleMap.prototype.get) as <
  K,
  V,
>(
  map: Map<K, V>,
  key: K
) => V | undefined
const hasLocaleMap = Function.prototype.call.bind(LocaleMap.prototype.has) as <
  K,
  V,
>(
  map: Map<K, V>,
  key: K
) => boolean
const setLocaleMap = Function.prototype.call.bind(LocaleMap.prototype.set) as <
  K,
  V,
>(
  map: Map<K, V>,
  key: K,
  value: V
) => void

const localeMapSize = Object.getOwnPropertyDescriptor(
  LocaleMap.prototype,
  'size'
)!.get!
const clearLocaleMap = LocaleMap.prototype.clear

function rawMatch(data: Supported, key: string): number | undefined {
  // ECMA-402 §9.2.7 step 2.a: retain the private best-fit exact-key cache.
  const cached = getLocaleMap(data.raw, key)
  if (cached !== undefined) return cached
  // A zero-distance match cannot be improved by later supported locales.
  for (let index = data.tags.length; index < data.original.length; index++) {
    const tag = canonicalize(data.original[index])
    setDataProperty(data.tags, `${index}`, tag)
    const candidate = rawKey(tag)
    if (!hasLocaleMap(data.raw, candidate))
      setLocaleMap(data.raw, candidate, index)
    if (candidate === key) return getLocaleMap(data.raw, candidate)
  }
  return undefined
}

function order(data: Supported, defaultLocale: string): number[] {
  // ECMA-402 §9.2.4: preserve the existing stable best-fit rank order.
  let result = getLocaleMap(data.orders, defaultLocale)
  if (!result) {
    if (!data.maximal) {
      const profiles: LSR[] = []
      for (let index = 0; index < data.tags.length; index++) {
        setDataProperty(profiles, `${index}`, maximal(data.tags[index]))
      }
      data.maximal = profiles
      const exact = new LocaleMap<string, number>()
      data.exact = exact
      for (let index = 0; index < profiles.length; index++) {
        const {key} = profiles[index]
        if (!hasLocaleMap(exact, key)) setLocaleMap(exact, key, index)
      }
    }
    if (!paradigms) {
      const keys = new LocaleSet<string>()
      const tags = matchingData.paradigms
      for (let index = 0; index < tags.length; index++) {
        addLocaleSet(keys, equivalentKey(maximal(canonicalize(tags[index]))))
      }
      paradigms = keys
    }
    const defaultKey = defaultLocale
      ? equivalentKey(maximal(canonicalize(defaultLocale)))
      : ''
    const rank = (index: number) => {
      const key = equivalentKey(data.maximal![index])
      return key === defaultKey ? 0 : hasLocaleSet(paradigms!, key) ? 1 : 2
    }
    result = []
    for (let index = 0; index < data.tags.length; index++) {
      setDataProperty(result, `${index}`, index)
    }
    apply(sortLocaleIndexes, result, [
      (a: number, b: number) => rank(a) - rank(b),
    ])
    setLocaleMap(data.orders, defaultLocale, result)
  }
  return result
}

function moreLikely(candidate: LSR, previous: LSR): boolean {
  if (candidate.language !== previous.language) return false
  if (!languageSubtag(candidate.language)) return false
  const likely = maximal(candidate.language)
  return candidate.script !== previous.script
    ? candidate.script === likely.script
    : candidate.region !== previous.region && candidate.region === likely.region
}

function equivalentMatch(
  desired: LSR,
  data: Supported
): {index: number; distance: number} | undefined {
  let best: {index: number; distance: number} | undefined
  // Every ordinary equivalent LSR is one of these eight explicit-subtag subsets.
  for (let flags = 0; flags < 8; flags++) {
    let key = flags & 4 ? desired.language : 'und'
    if (flags & 2 && desired.script) key += '-' + desired.script
    if (flags & 1 && desired.region) key += '-' + desired.region
    const index = getLocaleMap(data.raw, key)
    if (index === undefined) continue
    const supported = maximal(data.tags[index])
    if (equivalentKey(desired) !== equivalentKey(supported)) continue
    const d = distance(desired, supported)
    if (
      d < minDistance(1, MIN_LSR_DISTANCE) &&
      (!best ||
        d < best.distance ||
        (d === best.distance && index < best.index))
    )
      best = {index, distance: d}
  }
  return best
}

/** Cached exact LSR lookup, then ICU distance matching. Threshold is exclusive. */
export function findBestMatch(
  requestedLocales: readonly string[],
  supportedLocales: readonly string[],
  threshold: number = DEFAULT_MATCHING_THRESHOLD,
  defaultLocale: string = supportedLocales[0] || '',
  collectDistances = true
): LocaleMatchingResult {
  // ECMA-402 §9.2.4: a private no-match result has no inherited fields.
  const result = {__proto__: null, distances: {}} as LocaleMatchingResult
  if (!supportedLocales.length || !requestedLocales.length || threshold <= 0)
    return result
  const data = prepare(supportedLocales)
  // Derive demotion from the same data as ICU, rather than hardcoding a penalty.
  const demotion = matchingData.demotion
  let bestDistance = threshold
  for (let i = 0; i < requestedLocales.length && bestDistance > 0; i++) {
    const desiredTag = requestedLocales[i]
    const canonical = canonicalize(desiredTag)
    const exactRaw = rawMatch(data, rawKey(canonical))
    if (exactRaw !== undefined) {
      result.matchedDesiredLocale = desiredTag
      result.matchedSupportedLocale = supportedLocales[exactRaw]
      if (collectDistances)
        result.distances[desiredTag] = {
          [supportedLocales[exactRaw]]: i * demotion,
        }
      return result
    }
    const desired = maximal(canonical)
    const cacheKey = `${canonical}|${defaultLocale}`
    if (!collectDistances) {
      const equivalent =
        getLocaleMap(data.best, cacheKey) || equivalentMatch(desired, data)
      if (
        equivalent &&
        equivalent.distance < minDistance(1, MIN_LSR_DISTANCE)
      ) {
        setLocaleMap(data.best, cacheKey, equivalent)
        if (equivalent.distance < bestDistance) {
          bestDistance = equivalent.distance
          result.matchedDesiredLocale = desiredTag
          result.matchedSupportedLocale = supportedLocales[equivalent.index]
        }
        bestDistance -= demotion
        continue
      }
    }
    const indexes = order(data, defaultLocale)
    const exact = getLocaleMap(data.exact!, desired.key)
    if (exact !== undefined) {
      result.matchedDesiredLocale = desiredTag
      result.matchedSupportedLocale = supportedLocales[exact]
      if (collectDistances)
        result.distances[desiredTag] = {[supportedLocales[exact]]: i * demotion}
      return result
    }
    let best = collectDistances ? undefined : getLocaleMap(data.best, cacheKey)
    if (!best) {
      best = {index: -1, distance: Infinity}
      const distances: Record<string, number> = {}
      for (let candidate = 0; candidate < indexes.length; candidate++) {
        const index = indexes[candidate]
        const d = collectDistances
          ? findMatchingDistance(desiredTag, supportedLocales[index])
          : distance(desired, data.maximal![index])
        if (collectDistances)
          distances[supportedLocales[index]] = d + i * demotion
        if (
          d < best.distance ||
          (d === best.distance &&
            d >= 1 &&
            best.index >= 0 &&
            moreLikely(data.maximal![index], data.maximal![best.index]))
        ) {
          best = {index, distance: d}
        }
      }
      if (collectDistances) result.distances[desiredTag] = distances
      else {
        if (apply(localeMapSize, data.best, []) >= 256)
          apply(clearLocaleMap, data.best, [])
        setLocaleMap(data.best, cacheKey, best)
      }
    }
    if (best.distance < bestDistance) {
      bestDistance = best.distance
      result.matchedDesiredLocale = desiredTag
      result.matchedSupportedLocale = supportedLocales[best.index]
    }
    bestDistance -= demotion
  }
  return result
}
