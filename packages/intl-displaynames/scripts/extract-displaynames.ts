import glob from 'fast-glob'
import {resolve, dirname} from 'path'
import {DisplayNamesData, invariant} from '@formatjs/ecma402-abstract'
import * as AVAILABLE_LOCALES from 'cldr-core/availableLocales.json'

// CLDR JSON types
type LanguageRawData =
  typeof import('cldr-localenames-full/main/en/languages.json')['main']['en']['localeDisplayNames']['languages']
type RegionRawData =
  typeof import('cldr-localenames-full/main/en/territories.json')['main']['en']['localeDisplayNames']['territories']
type ScriptRawData =
  typeof import('cldr-localenames-full/main/en/scripts.json')['main']['en']['localeDisplayNames']['scripts']
type LocalePatternRawData =
  typeof import('cldr-localenames-full/main/en/localeDisplayNames.json')['main']['en']['localeDisplayNames']['localeDisplayPattern']['localePattern']
type CurrencyRawData =
  typeof import('cldr-numbers-full/main/en/currencies.json')['main']['en']['numbers']['currencies']
type CalendarRawData =
  typeof import('cldr-localenames-full/main/en/localeDisplayNames.json')['main']['en']['localeDisplayNames']['types']['calendar']
type DateTimeFieldRawData =
  typeof import('cldr-dates-full/main/en/dateFields.json')['main']['en']['dates']['fields']
// -------------------------------------------------------------------------------------------------

export async function getAllLocales(): Promise<string[]> {
  const fns = await glob('*/localeDisplayNames.json', {
    cwd: resolve(
      dirname(require.resolve('cldr-localenames-full/package.json')),
      './main'
    ),
  })
  return fns.map(dirname).filter(l => {
    try {
      return (Intl as any).getCanonicalLocales(l).length
    } catch (e) {
      console.warn(`Invalid locale ${l}`)
      return false
    }
  })
}

function extractStyleData(
  cldrData: Record<string, string>
): Record<'long' | 'short' | 'narrow', Record<string, string>> {
  const longData: Record<string, string> = {}
  const shortData: Record<string, string> = {}
  const narrowData: Record<string, string> = {}
  for (const [key, value] of Object.entries(cldrData)) {
    if (key.includes('-alt-')) {
      // As of Jan 2020, there is no `-alt-narrow`.
      if (key.includes('-alt-narrow')) {
        narrowData[key.replace(/-alt-narrow.*/, '')] = value
      } else if (key.includes('-alt-short')) {
        shortData[key.replace(/-alt-short.*/, '')] = value
      }
      // Not sure why `-alt-long` exists. Ignore them for now.
    } else {
      longData[key] = value
    }
  }
  return {long: longData, short: shortData, narrow: narrowData}
}

// Currency code -> {Property -> Value}.
function extractCurrencyStyleData(
  locale: string,
  cldrData: CurrencyRawData
): Record<'long' | 'short' | 'narrow', Record<string, string>> {
  const longData: Record<string, string> = {}
  for (const [currencyCode, value] of Object.entries(cldrData)) {
    // There does not seem to be narrow or short display names.
    const displayName = value.displayName
    invariant(
      !!displayName,
      `displayName does not exist for currency ${currencyCode} of locale ${locale}.`
    )
    longData[currencyCode] = displayName
  }
  return {long: longData, short: {}, narrow: {}}
}

// Some keys used in the CLDR file differ from the ones in the TC39 proposal.
// This constant maps them.
const CLDR_TO_TC39_KEYS: Record<string, string> = {
  week: 'weekOfYear',
  zone: 'timeZoneName',
}
function extractDateTimeFieldStyleData(
  cldrData: DateTimeFieldRawData
): Record<'long' | 'short' | 'narrow', Record<string, string>> {
  const longData: Record<string, string> = {}
  const shortData: Record<string, string> = {}
  const narrowData: Record<string, string> = {}
  for (const [key, value] of Object.entries(cldrData)) {
    if ('displayName' in value) {
      if (key.includes('-narrow')) {
        const newKey = key.replace(/-narrow.*/, '')
        narrowData[CLDR_TO_TC39_KEYS[newKey] || newKey] = value.displayName
      } else if (key.includes('-short')) {
        const newKey = key.replace(/-short.*/, '')
        shortData[CLDR_TO_TC39_KEYS[newKey] || newKey] = value.displayName
      } else {
        longData[CLDR_TO_TC39_KEYS[key] || key] = value.displayName
      }
    }
  }
  return {long: longData, short: shortData, narrow: narrowData}
}

function getStandardLanguageValue(
  key: string,
  style: '-alt-narrow' | '-alt-short' | '',
  dialectValue: string,
  cldrLanguageData: Record<string, string>,
  cldrRegionData: Record<string, string>,
  localePattern: string
): string {
  const regionMatch = /-([a-z]{2}|\d{3})\b/i.exec(key)
  if (regionMatch) {
    const languageSubTag =
      key.substring(0, regionMatch.index) +
      key.substring(regionMatch.index + regionMatch[0].length)
    const regionSubTag = regionMatch[1]

    const languageDisplayName = cldrLanguageData[languageSubTag]
    const regionDisplayName = cldrRegionData[regionSubTag + style]
    return localePattern
      .replace('{0}', languageDisplayName)
      .replace('{1}', regionDisplayName || regionSubTag)
  }
  return dialectValue
}

function extractStandardLanguageStyleData(
  cldrLanguageData: Record<string, string>,
  cldrRegionData: Record<string, string>,
  localePattern: string
): Record<'long' | 'short' | 'narrow', Record<string, string>> {
  const longData: Record<string, string> = {}
  const shortData: Record<string, string> = {}
  const narrowData: Record<string, string> = {}
  for (const [key, value] of Object.entries(cldrLanguageData)) {
    if (key.includes('-alt-')) {
      // As of Jan 2020, there is no `-alt-narrow`.
      if (key.includes('-alt-narrow')) {
        const newKey = key.replace(/-alt-narrow.*/, '')
        narrowData[newKey] = getStandardLanguageValue(
          newKey,
          '-alt-narrow',
          value,
          cldrLanguageData,
          cldrRegionData,
          localePattern
        )
      } else if (key.includes('-alt-short')) {
        const newKey = key.replace(/-alt-short.*/, '')
        shortData[newKey] = getStandardLanguageValue(
          newKey,
          '-alt-short',
          value,
          cldrLanguageData,
          cldrRegionData,
          localePattern
        )
      }
      // Not sure why `-alt-long` exists. Ignore them for now.
    } else {
      longData[key] = getStandardLanguageValue(
        key,
        '',
        value,
        cldrLanguageData,
        cldrRegionData,
        localePattern
      )
    }
  }
  return {long: longData, short: shortData, narrow: narrowData}
}

function extractLanguageStyleData(
  cldrLanguageData: LanguageRawData,
  cldrRegionData: RegionRawData,
  cldrLocalePatternData: LocalePatternRawData
): {
  dialect: Record<'long' | 'short' | 'narrow', Record<string, string>>
  standard: Record<'long' | 'short' | 'narrow', Record<string, string>>
} {
  return {
    dialect: extractStyleData(cldrLanguageData),
    standard: extractStandardLanguageStyleData(
      cldrLanguageData,
      cldrRegionData,
      cldrLocalePatternData
    ),
  }
}

async function loadDisplayNames(locale: string): Promise<DisplayNamesData> {
  const [
    languages,
    territories,
    scripts,
    localeDisplayNames,
    currencies,
    dateFields,
  ] = await Promise.all([
    import(`cldr-localenames-full/main/${locale}/languages.json`),
    import(`cldr-localenames-full/main/${locale}/territories.json`),
    import(`cldr-localenames-full/main/${locale}/scripts.json`),
    import(`cldr-localenames-full/main/${locale}/localeDisplayNames.json`),
    import(`cldr-numbers-full/main/${locale}/currencies.json`),
    import(`cldr-dates-full/main/${locale}/dateFields.json`),
  ])
  const langData: LanguageRawData =
    languages.main[locale].localeDisplayNames.languages
  const regionData: RegionRawData =
    territories.main[locale].localeDisplayNames.territories
  const scriptData: ScriptRawData =
    scripts.main[locale].localeDisplayNames.scripts
  const localePatternData: LocalePatternRawData =
    localeDisplayNames.main[locale].localeDisplayNames.localeDisplayPattern
      .localePattern
  const currencyData: CurrencyRawData =
    currencies.main[locale].numbers.currencies
  const calendarData: CalendarRawData =
    localeDisplayNames.main[locale].localeDisplayNames.types.calendar
  const dateTimeFieldData: DateTimeFieldRawData =
    dateFields.main[locale].dates.fields

  return {
    types: {
      language: extractLanguageStyleData(
        langData,
        regionData,
        localePatternData
      ),
      region: extractStyleData(regionData),
      script: extractStyleData(scriptData),
      currency: extractCurrencyStyleData(locale, currencyData),
      calendar: extractStyleData(calendarData),
      dateTimeField: extractDateTimeFieldStyleData(dateTimeFieldData),
    },
    patterns: {
      // No support for alt variants
      locale: localePatternData,
    },
  }
}

export async function extractDisplayNames(
  locales: string[] = AVAILABLE_LOCALES.availableLocales.full
): Promise<Record<string, DisplayNamesData>> {
  const data = await Promise.all(locales.map(loadDisplayNames))
  return locales.reduce((all: Record<string, DisplayNamesData>, locale, i) => {
    all[locale] = data[i]
    return all
  }, {})
}
