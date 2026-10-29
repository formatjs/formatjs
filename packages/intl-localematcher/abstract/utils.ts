import {memoize} from '@formatjs/fast-memoize'
import {matchingData} from '@formatjs_generated/cldr.core/matching.js'
// ECMA-402 §9.2.3, steps 1.b.i–ii: extract only the Unicode extension.
// A private-use subtag named "u" does not start a Unicode extension.
// https://tc39.es/ecma402/#sec-lookupmatchinglocalebyprefix
// https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/negotiation.html#L116-L118
export function splitUnicodeExtension(locale: string): {
  locale: string
  extension?: string
} {
  const subtags = locale.split('-')
  for (let i = 1; i < subtags.length; i++) {
    if (subtags[i] === 'x') break
    if (subtags[i] !== 'u') continue
    let end = i + 1
    while (end < subtags.length && subtags[end].length > 1) end++
    return {
      locale: [...subtags.slice(0, i), ...subtags.slice(end)].join('-'),
      extension: '-' + subtags.slice(i, end).join('-'),
    }
  }
  return {locale}
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
  Err: any = Error
): asserts condition {
  if (!condition) {
    throw new Err(message)
  }
}

// ICU 78 defaults: language first, one-way matches enabled, region demotion.
const DEFAULT_MATCHING_THRESHOLD = matchingData.defaults[1]
const DISTANCE_SCALE = 8
const MIN_LSR_DISTANCE = matchingData.minLsrDistance
const languageAliases = new Set(matchingData.canonicalAliases.language)
const scriptAliases = new Set(matchingData.canonicalAliases.script)
const regionAliases = new Set(matchingData.canonicalAliases.region)

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
    const code = value.charCodeAt(i)
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

// ASCII parsing preserves legacy RegExp statics during Intl construction.
function prefix(tag: string): {
  language: string
  script: string
  region: string
  end: number
} {
  let end = tag.indexOf('-')
  if (end < 0) end = tag.length
  const language = tag.slice(0, end)
  let script = ''
  let region = ''
  if (end < tag.length) {
    let next = tag.indexOf('-', end + 1)
    if (next < 0) next = tag.length
    let part = tag.slice(end + 1, next)
    if (scriptSubtag(part)) {
      script = part
      end = next
      next = tag.indexOf('-', end + 1)
      if (next < 0) next = tag.length
      part = tag.slice(end + 1, next)
    }
    if (regionSubtag(part)) {
      region = part
      end = next
    }
  }
  return {language, script, region, end}
}

function fields(tag: string): LSR {
  const parsed = prefix(tag)
  const language = parsed.language
  let {script, region} = parsed
  const parts =
    parsed.end < tag.length ? tag.slice(parsed.end + 1).split('-') : []
  const extension = parts.findIndex(part => part.length === 1)
  const variants = extension < 0 ? parts : parts.slice(0, extension)
  const pseudo = variants.find(
    p => p === 'psaccent' || p === 'psbidi' || p === 'pscrack'
  )
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
      tag === 'und' || tag.startsWith('und-x-')
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
      !languageAliases.has(basic.language) &&
      !scriptAliases.has(basic.script) &&
      !regionAliases.has(basic.region)
    )
      return tag
    return Intl.getCanonicalLocales(tag)[0]
  },
  {serializer: stringKey}
)
const maximal = memoize(
  (tag: string): LSR => {
    const input = fields(tag)
    // ICU keeps bare und, private-use locales and pseudolocales isolated.
    if (tag === 'und' || tag.startsWith('und-x-')) {
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
    const locale = new Intl.Locale(tag).maximize()
    let flags = input.flags
    if (matchingData.macroRegions.includes(input.region)) {
      const regionLocale = new Intl.Locale(`und-${input.region}`).maximize()
      if (
        (input.language === 'und' &&
          (!input.script || input.script === regionLocale.script)) ||
        (!input.script && !new Intl.Locale(input.language).maximize().script)
      )
        flags &= ~1
    }
    let language = locale.language
    let script = locale.script || ''
    let region = locale.region || ''
    // Locale maximization can leave unknown tags incomplete; ICU matching fills them through und.
    if (language === 'und' || !script || !region) {
      const fallback = new Intl.Locale(
        ['und', script, region].filter(Boolean).join('-')
      ).maximize()
      if (language === 'und')
        language = fallback.language === 'und' ? 'en' : fallback.language
      script ||= fallback.script || 'Latn'
      region ||= fallback.region || 'US'
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
  if (tag.startsWith('und-x-')) return tag
  const parsed = prefix(tag)
  const base = tag.slice(0, parsed.end)
  if (pseudoRegion(parsed.region)) return base
  if (tag.includes('-ps')) {
    const input = fields(tag)
    if (input.pseudo) return input.key
  }
  if (parsed.script !== 'Zzzz' && parsed.region !== 'ZZ') return base
  return [
    parsed.language,
    parsed.script === 'Zzzz' ? '' : parsed.script,
    parsed.region === 'ZZ' ? '' : parsed.region,
  ]
    .filter(Boolean)
    .join('-')
}

function distance(desired: LSR, supported: LSR): number {
  const languages = `${desired.language}|${supported.language}`
  let result =
    desired.language === supported.language
      ? 0
      : (matchingData.language[languages] ?? matchingData.defaults[0])
  if (desired.script !== supported.script) {
    result +=
      matchingData.script[
        `${languages}|${desired.script}|${supported.script}`
      ] ?? matchingData.defaults[1]
  }
  if (desired.region !== supported.region) {
    const matrix =
      matchingData.region[
        `${languages}|${desired.script}|${supported.script}`
      ] ?? matchingData.region[`${languages}|*|*`]
    const desiredPartitions = matchingData.regions[desired.region]
    const supportedPartitions = matchingData.regions[supported.region]
    let regionDistance = matchingData.defaults[2]
    if (matrix && desiredPartitions && supportedPartitions) {
      regionDistance = 0
      // Macroregions cover several partitions: ICU takes the worst pair.
      for (const d of desiredPartitions) {
        for (const s of supportedPartitions) {
          regionDistance = Math.max(
            regionDistance,
            matrix[d * matchingData.partitionCount + s]
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
  original: string[]
  tags: string[]
  raw: Map<string, number>
  maximal?: LSR[]
  exact?: Map<string, number>
  orders: Map<string, number[]>
  best: Map<string, {index: number; distance: number}>
}
const supportedCache = new WeakMap<readonly string[], Supported>()
let paradigms: Set<string> | undefined

function equivalentKey(lsr: LSR): string {
  return `${lsr.language}|${lsr.script}|${lsr.region}`
}

function prepare(locales: readonly string[]): Supported {
  let result = supportedCache.get(locales)
  if (
    result &&
    (result.original.length !== locales.length ||
      result.original.some((tag, index) => tag !== locales[index]))
  )
    result = undefined
  if (!result) {
    result = {
      original: Array.from(locales),
      tags: [],
      raw: new Map(),
      orders: new Map(),
      best: new Map(),
    }
    supportedCache.set(locales, result)
  }
  return result
}

function rawMatch(data: Supported, key: string): number | undefined {
  const cached = data.raw.get(key)
  if (cached !== undefined) return cached
  // A zero-distance match cannot be improved by later supported locales.
  for (let index = data.tags.length; index < data.original.length; index++) {
    const tag = canonicalize(data.original[index])
    // CreateDataProperty avoids inherited numeric setters on internal arrays.
    Object.defineProperty(data.tags, index, {
      value: tag,
      writable: true,
      enumerable: true,
      configurable: true,
    })
    const candidate = rawKey(tag)
    if (!data.raw.has(candidate)) data.raw.set(candidate, index)
    if (candidate === key) return data.raw.get(candidate)
  }
  return undefined
}

function order(data: Supported, defaultLocale: string): number[] {
  let result = data.orders.get(defaultLocale)
  if (!result) {
    if (!data.maximal) {
      data.maximal = data.tags.map(maximal)
      data.exact = new Map()
      data.maximal.forEach((lsr, index) => {
        if (!data.exact!.has(lsr.key)) data.exact!.set(lsr.key, index)
      })
    }
    paradigms ??= new Set(
      matchingData.paradigms.map(tag =>
        equivalentKey(maximal(canonicalize(tag)))
      )
    )
    const defaultKey = defaultLocale
      ? equivalentKey(maximal(canonicalize(defaultLocale)))
      : ''
    const rank = (index: number) => {
      const key = equivalentKey(data.maximal![index])
      return key === defaultKey ? 0 : paradigms!.has(key) ? 1 : 2
    }
    result = data.tags.map((_, i) => i).sort((a, b) => rank(a) - rank(b))
    data.orders.set(defaultLocale, result)
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
    const key = [
      flags & 4 ? desired.language : 'und',
      flags & 2 ? desired.script : '',
      flags & 1 ? desired.region : '',
    ]
      .filter(Boolean)
      .join('-')
    const index = data.raw.get(key)
    if (index === undefined) continue
    const supported = maximal(data.tags[index])
    if (equivalentKey(desired) !== equivalentKey(supported)) continue
    const d = distance(desired, supported)
    if (
      d < Math.min(1, MIN_LSR_DISTANCE) &&
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
  const result: LocaleMatchingResult = {distances: {}}
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
        data.best.get(cacheKey) || equivalentMatch(desired, data)
      if (equivalent && equivalent.distance < Math.min(1, MIN_LSR_DISTANCE)) {
        data.best.set(cacheKey, equivalent)
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
    const exact = data.exact!.get(desired.key)
    if (exact !== undefined) {
      result.matchedDesiredLocale = desiredTag
      result.matchedSupportedLocale = supportedLocales[exact]
      if (collectDistances)
        result.distances[desiredTag] = {[supportedLocales[exact]]: i * demotion}
      return result
    }
    let best = collectDistances ? undefined : data.best.get(cacheKey)
    if (!best) {
      best = {index: -1, distance: Infinity}
      const distances: Record<string, number> = {}
      for (const index of indexes) {
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
        if (data.best.size >= 256) data.best.clear()
        data.best.set(cacheKey, best)
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
