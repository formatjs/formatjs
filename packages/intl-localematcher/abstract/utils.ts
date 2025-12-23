import {memoize} from '@formatjs/fast-memoize'
import {data as jsonData} from './languageMatching.js'
import {regions} from './regions.generated.js'
export const UNICODE_EXTENSION_SEQUENCE_REGEX: RegExp =
  /-u(?:-[0-9a-z]{2,8})+/gi

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

// This is effectively 2 languages in 2 different regions in the same cluster
const DEFAULT_MATCHING_THRESHOLD = 838

interface LSR {
  language: string
  script: string
  region: string
}

interface LanguageMatchInfo {
  supported: string
  desired: string
  distance: number
  oneway: boolean
}

interface LanguageInfo {
  matches: LanguageMatchInfo[]
  matchVariables: Record<string, string[]>
  paradigmLocales: string[]
}

let PROCESSED_DATA: LanguageInfo | undefined

function processData(): LanguageInfo {
  if (!PROCESSED_DATA) {
    const paradigmLocales = jsonData.supplemental.languageMatching[
      'written-new'
    ][0]?.paradigmLocales?._locales.split(' ') as any
    const matchVariables = jsonData.supplemental.languageMatching[
      'written-new'
    ].slice(1, 5) as any[]
    const data = jsonData.supplemental.languageMatching['written-new'].slice(5)
    const matches = data.map(d => {
      const key = Object.keys(d)[0] as string
      const value = (
        d as Record<
          string,
          {
            _desired: string
            _distance: string
            oneway?: string
          }
        >
      )[key]
      return {
        supported: key,
        desired: value._desired,
        distance: +value._distance,
        oneway: value.oneway === 'true' ? true : false,
      }
    }, {})
    PROCESSED_DATA = {
      matches,
      matchVariables: matchVariables.reduce<Record<string, string[]>>(
        (all, d) => {
          const key = Object.keys(d)[0] as string
          const value = d[key]
          all[key.slice(1)] = value._value.split('+')
          return all
        },
        {}
      ),
      paradigmLocales: [
        ...paradigmLocales,
        ...paradigmLocales.map((l: string) =>
          new Intl.Locale(l.replace(/_/g, '-')).maximize().toString()
        ),
      ],
    }
  }

  return PROCESSED_DATA
}

function isMatched(
  locale: LSR,
  languageMatchInfoLocale: string,
  matchVariables: Record<string, string[]>
): boolean {
  const [language, script, region] = languageMatchInfoLocale.split('-')
  let matches = true
  if (region && region[0] === '$') {
    const shouldInclude = region[1] !== '!'
    const matchRegions = shouldInclude
      ? matchVariables[region.slice(1)]
      : matchVariables[region.slice(2)]
    const expandedMatchedRegions = matchRegions
      .map(r => regions[r] || [r])
      .reduce((all, list) => [...all, ...list], [])
    matches &&= !(
      expandedMatchedRegions.indexOf(locale.region || '') > -1 !=
      shouldInclude
    )
  } else {
    matches &&= locale.region
      ? region === '*' || region === locale.region
      : true
  }
  matches &&= locale.script ? script === '*' || script === locale.script : true
  matches &&= locale.language
    ? language === '*' || language === locale.language
    : true
  return matches
}

function serializeLSR(lsr: LSR): string {
  return [lsr.language, lsr.script, lsr.region].filter(Boolean).join('-')
}

function findMatchingDistanceForLSR(
  desired: LSR,
  supported: LSR,
  data: LanguageInfo
): number {
  for (const d of data.matches) {
    let matches =
      isMatched(desired, d.desired, data.matchVariables) &&
      isMatched(supported, d.supported, data.matchVariables)
    if (!d.oneway && !matches) {
      matches =
        isMatched(desired, d.supported, data.matchVariables) &&
        isMatched(supported, d.desired, data.matchVariables)
    }
    if (matches) {
      const distance = d.distance * 10
      if (
        data.paradigmLocales.indexOf(serializeLSR(desired)) > -1 !=
        data.paradigmLocales.indexOf(serializeLSR(supported)) > -1
      ) {
        return distance - 1
      }
      return distance
    }
  }
  throw new Error('No matching distance found')
}

function findMatchingDistanceImpl(desired: string, supported: string): number {
  const desiredLocale = new Intl.Locale(desired).maximize()
  const supportedLocale = new Intl.Locale(supported).maximize()
  const desiredLSR: LSR = {
    language: desiredLocale.language,
    script: desiredLocale.script || '',
    region: desiredLocale.region || '',
  }
  const supportedLSR: LSR = {
    language: supportedLocale.language,
    script: supportedLocale.script || '',
    region: supportedLocale.region || '',
  }
  let matchingDistance = 0

  const data = processData()

  if (desiredLSR.language !== supportedLSR.language) {
    matchingDistance += findMatchingDistanceForLSR(
      {
        language: desiredLocale.language,
        script: '',
        region: '',
      },
      {
        language: supportedLocale.language,
        script: '',
        region: '',
      },
      data
    )
  }

  if (desiredLSR.script !== supportedLSR.script) {
    matchingDistance += findMatchingDistanceForLSR(
      {
        language: desiredLocale.language,
        script: desiredLSR.script,
        region: '',
      },
      {
        language: supportedLocale.language,
        script: supportedLSR.script,
        region: '',
      },
      data
    )
  }

  if (desiredLSR.region !== supportedLSR.region) {
    matchingDistance += findMatchingDistanceForLSR(
      desiredLSR,
      supportedLSR,
      data
    )
  }

  return matchingDistance
}

/**
 * Calculates the matching distance between two locales using the CLDR Enhanced Language Matching algorithm.
 * This function is memoized for performance, as distance calculations are expensive.
 *
 * The distance represents how "far apart" two locales are, with 0 being identical (after maximization).
 * Distances are calculated based on Language-Script-Region (LSR) differences using CLDR data.
 *
 * @param desired - The desired locale (e.g., "en-US")
 * @param supported - The supported locale to compare against (e.g., "en-GB")
 * @returns The calculated distance between the locales
 *
 * @example
 * ```ts
 * findMatchingDistance('en-US', 'en-US') // 0 - identical
 * findMatchingDistance('en-US', 'en-GB') // 40 - same language/script, different region
 * findMatchingDistance('es-CO', 'es-419') // 39 - regional variant
 * findMatchingDistance('en', 'fr') // 840 - completely different languages
 * ```
 *
 * @see https://unicode.org/reports/tr35/#EnhancedLanguageMatching
 */
export const findMatchingDistance: (
  desired: string,
  supported: string
) => number = memoize(findMatchingDistanceImpl, {
  serializer: (args: any[]) => `${args[0]}|${args[1]}`,
})

interface LocaleMatchingResult {
  distances: Record<string, Record<string, number>>
  matchedSupportedLocale?: string
  matchedDesiredLocale?: string
}

/**
 * Generates fallback candidates by progressively removing subtags
 * e.g., "en-US" -> ["en-US", "en"]
 *      "zh-Hans-CN" -> ["zh-Hans-CN", "zh-Hans", "zh"]
 */
function getFallbackCandidates(locale: string): string[] {
  const candidates: string[] = []
  let current = locale

  while (current) {
    candidates.push(current)
    const lastDash = current.lastIndexOf('-')
    if (lastDash === -1) break
    current = current.substring(0, lastDash)
  }

  return candidates
}

/**
 * Finds the best locale match using a three-tier optimization hierarchy.
 *
 * ## Three-Tier Matching Algorithm:
 *
 * **Tier 1 - Fast Path** (O(n)): Exact string matching via Set lookup
 * - Example: 'en' matches 'en' exactly → distance 0
 * - Solves #4936: 48x faster than baseline (12ms vs 610ms with 700+ locales)
 *
 * **Tier 2 - Fallback Path** (O(k×n)): Maximization + progressive subtag removal
 * - Maximizes requested locale, then removes subtags right-to-left
 * - Example: "zh-TW" → "zh-Hant-TW" → ["zh-Hant-TW", "zh-Hant", "zh"]
 * - Distance: 0 for maximized match, 10 per removed subtag + position penalty
 * - 40-50x faster than full UTS #35, handles 99% of real-world cases correctly
 *
 * **Tier 3 - Slow Path** (O(n×m), memoized): Full UTS #35 CLDR matching
 * - Calculates Language-Script-Region distances using CLDR data
 * - Handles complex cases like cross-script matching (sr-Cyrl ↔ sr-Latn)
 * - Only used when Tiers 1 & 2 find no match
 * - Still 6x faster than baseline due to memoization
 *
 * ## Performance Impact of Maximization:
 *
 * While Tier 2 now calls `Intl.Locale().maximize()` once per requested locale,
 * this is still much faster than Tier 3's full distance calculation:
 * - Tier 1: ~12ms (exact match, no maximization)
 * - Tier 2: ~13-15ms (maximization + fallback)
 * - Tier 3: ~100ms+ (full UTS #35 with all supported locales)
 *
 * @param requestedLocales - Locale identifiers in preference order
 * @param supportedLocales - Available locale identifiers
 * @param threshold - Maximum distance (default: 838, from CLDR)
 * @returns Matching result with distances
 *
 * @example
 * ```ts
 * // Tier 1: Exact match
 * findBestMatch(['en'], ['en', 'fr'])
 * // → { matchedSupportedLocale: 'en', distances: { en: { en: 0 } } }
 *
 * // Tier 2: Fallback with maximization
 * findBestMatch(['zh-TW'], ['zh-Hant'])
 * // → zh-TW maximizes to zh-Hant-TW, falls back to zh-Hant (distance 0)
 *
 * findBestMatch(['en-US'], ['en'])
 * // → en-US maximizes to en-Latn-US, falls back to en (distance 10)
 *
 * // Tier 3: Full calculation
 * findBestMatch(['en-XZ'], ['ja', 'ko'])
 * // → No fallback match, uses UTS #35 to find closest match
 * ```
 *
 * @see https://unicode.org/reports/tr35/#EnhancedLanguageMatching
 * @see https://github.com/formatjs/formatjs/issues/4936
 */
// WeakMap to cache canonicalized supported locales arrays
const canonicalizedSupportedCache = new WeakMap<readonly string[], string[]>()

export function findBestMatch(
  requestedLocales: readonly string[],
  supportedLocales: readonly string[],
  threshold: number = DEFAULT_MATCHING_THRESHOLD
): LocaleMatchingResult {
  let lowestDistance = Infinity
  let result: LocaleMatchingResult = {
    matchedDesiredLocale: '',
    distances: {},
  }

  // Get or compute canonicalized supported locales (one by one to preserve indices)
  let canonicalizedSupportedLocales =
    canonicalizedSupportedCache.get(supportedLocales)
  if (!canonicalizedSupportedLocales) {
    canonicalizedSupportedLocales = supportedLocales.map(locale => {
      try {
        const canonical = Intl.getCanonicalLocales([locale])
        return canonical[0] || locale
      } catch {
        return locale
      }
    })
    canonicalizedSupportedCache.set(
      supportedLocales,
      canonicalizedSupportedLocales
    )
  }

  const supportedSet = new Set(canonicalizedSupportedLocales)

  // === TIER 1: FAST PATH - Exact Match ===
  // Check for exact matches in ALL requested locales
  // This is the fastest path and handles the majority of real-world cases
  for (let i = 0; i < requestedLocales.length; i++) {
    const desired = requestedLocales[i]
    if (supportedSet.has(desired)) {
      const distance = 0 + i * 40
      result.distances[desired] = {[desired]: distance}

      if (distance < lowestDistance) {
        lowestDistance = distance
        result.matchedDesiredLocale = desired
        result.matchedSupportedLocale = desired
      }

      // Only return immediately if this is the first requested locale (distance=0)
      // Otherwise, continue checking for potentially better matches
      if (i === 0) {
        return result
      }
    }
  }

  // If we found an exact match in Tier 1 (but not for first locale), check Tier 2
  // to see if there's a better fallback match with lower distance
  // If no exact match found, Tier 2 will find fallback matches

  // === TIER 2: FALLBACK PATH - Maximization + Progressive Subtag Removal ===
  // Try maximization-based matching before resorting to expensive Tier 3
  // This handles cases like zh-TW → zh-Hant efficiently
  for (let i = 0; i < requestedLocales.length; i++) {
    const desired = requestedLocales[i]

    // Maximize then fallback (for linguistic accuracy like zh-TW → zh-Hant)
    try {
      const maximized = new Intl.Locale(desired).maximize().toString()
      if (maximized !== desired) {
        const maximizedCandidates = getFallbackCandidates(maximized)
        for (let j = 0; j < maximizedCandidates.length; j++) {
          const candidate = maximizedCandidates[j]
          if (candidate === desired) continue // Already checked in Tier 1

          if (supportedSet.has(candidate)) {
            // Check if candidate also maximizes to the same form
            // e.g., zh-TW → zh-Hant-TW and zh-Hant → zh-Hant-TW (distance 0)
            // but es-co → es-Latn-CO and es → es-Latn-ES (distance 10)
            let distance: number
            try {
              const candidateMaximized = new Intl.Locale(candidate)
                .maximize()
                .toString()
              distance =
                candidateMaximized === maximized ? 0 + i * 40 : j * 10 + i * 40
            } catch {
              distance = j * 10 + i * 40
            }

            if (!result.distances[desired]) {
              result.distances[desired] = {}
            }
            result.distances[desired][candidate] = distance

            if (distance < lowestDistance) {
              lowestDistance = distance
              result.matchedDesiredLocale = desired
              result.matchedSupportedLocale = candidate
            }
            break // Stop after finding first maximized match
          }
        }
      }
    } catch {
      // Locale maximization failed, continue to Tier 3
    }
  }

  // If Tier 2 found a perfect maximized match (distance 0), return immediately (fast path)
  if (result.matchedSupportedLocale && lowestDistance === 0) {
    return result
  }

  // === TIER 3: SLOW PATH - Full UTS #35 Distance Calculation ===
  // Always run Tier 3 for full CLDR accuracy
  // Tier 3 may find better matches than Tier 2's fallback approach
  // findMatchingDistance is memoized, so repeated calculations are cached
  requestedLocales.forEach((desired, i) => {
    if (!result.distances[desired]) {
      result.distances[desired] = {}
    }
    canonicalizedSupportedLocales.forEach((canonicalLocale, supportedIndex) => {
      const originalSupported = supportedLocales[supportedIndex]

      // findMatchingDistance is memoized via fast-memoize
      // Use the canonical locale for distance calculation
      const distance = findMatchingDistance(desired, canonicalLocale)

      // Add some weight to the distance based on the order of the supported locales
      // Add penalty for the order of the requested locales, which currently is 0 since ECMA-402
      // doesn't really have room for weighted locales like `en; q=0.1`
      const finalDistance = distance + 0 + i * 40

      // Store and return the original locale, not the canonical one
      // Tier 3 overwrites Tier 2 distances (Tier 3 is more accurate)
      result.distances[desired][originalSupported] = finalDistance
      if (finalDistance < lowestDistance) {
        lowestDistance = finalDistance
        result.matchedDesiredLocale = desired
        result.matchedSupportedLocale = originalSupported
      }
    })
  })

  if (lowestDistance >= threshold) {
    result.matchedDesiredLocale = undefined
    result.matchedSupportedLocale = undefined
  }

  return result
}
