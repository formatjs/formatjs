import jsonData from './languageMatching.json'
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
    matches ||= matchRegions.includes(locale.region || '') != shouldInclude
  } else if (region === '*' || region === locale.region) {
    matches ||= true
  } else {
    return false
  }

  if (script === '*' || script === locale.script) {
    matches ||= true
  } else {
    return false
  }

  if (language === '*' || language === locale.language) {
    matches ||= true
  } else {
    return false
  }
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
      console.log('matched', desired, supported, d)
      const distance = d.distance * 10
      if (
        data.paradigmLocales.includes(serializeLSR(desired)) !=
        data.paradigmLocales.includes(serializeLSR(supported))
      ) {
        console.log('matched paradigm locale', desired, supported, d)
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
  if (desiredLSR.region !== supportedLSR.region) {
    matchingDistance += findMatchingDistanceForLSR(
      desiredLSR,
      supportedLSR,
      data
    )
  }

  desiredLSR.region = ''
  supportedLSR.region = ''

  if (desiredLSR.script !== supportedLSR.script) {
    matchingDistance += findMatchingDistanceForLSR(
      desiredLSR,
      supportedLSR,
      data
    )
  }

  desiredLSR.script = ''
  supportedLSR.script = ''

  if (desiredLSR.language !== supportedLSR.language) {
    matchingDistance += findMatchingDistanceForLSR(
      desiredLSR,
      supportedLSR,
      data
    )
  }

  return matchingDistance
}

export function findBestMatch(
  desired: string,
  supportedLocales: string[]
): string | undefined {
  let bestMatch = undefined
  let lowestDistance = Infinity
  supportedLocales.forEach(supported => {
    const distance = findMatchingDistance(desired, supported)
    if (distance < lowestDistance) {
      lowestDistance = distance
      bestMatch = supported
    }
  })

  return bestMatch
}
