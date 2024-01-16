import {data as jsonData} from './languageMatching'
import {regions} from './regions.generated'
export const UNICODE_EXTENSION_SEQUENCE_REGEX = /-u(?:-[0-9a-z]{2,8})+/gi

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
      const value = d[key as 'no'] as {
        _desired: string
        _distance: string
        oneway?: string
      }
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
      expandedMatchedRegions.indexOf(locale.region || '') > 1 !=
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

export function findMatchingDistance(desired: string, supported: string) {
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
        script: desiredLSR.script,
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

interface LocaleMatchingResult {
  distances: Record<string, Record<string, number>>
  matchedSupportedLocale?: string
  matchedDesiredLocale?: string
}

export function findBestMatch(
  requestedLocales: readonly string[],
  supportedLocales: readonly string[],
  threshold = DEFAULT_MATCHING_THRESHOLD
): LocaleMatchingResult {
  let lowestDistance = Infinity
  let result: LocaleMatchingResult = {
    matchedDesiredLocale: '',
    distances: {},
  }
  requestedLocales.forEach((desired, i) => {
    if (!result.distances[desired]) {
      result.distances[desired] = {}
    }
    supportedLocales.forEach(supported => {
      // Add some weight to the distance based on the order of the supported locales
      // Add penalty for the order of the requested locales, which currently is 0 since ECMA-402
      // doesn't really have room for weighted locales like `en; q=0.1`
      const distance = findMatchingDistance(desired, supported) + 0 + i * 40

      result.distances[desired][supported] = distance
      if (distance < lowestDistance) {
        lowestDistance = distance
        result.matchedDesiredLocale = desired
        result.matchedSupportedLocale = supported
      }
    })
  })

  if (lowestDistance >= threshold) {
    result.matchedDesiredLocale = undefined
    result.matchedSupportedLocale = undefined
  }

  return result
}
