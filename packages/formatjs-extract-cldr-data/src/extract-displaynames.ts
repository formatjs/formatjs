import {Locale} from './types';
import generateFieldExtractorFn from './utils';
import {sync as globSync} from 'glob';
import {resolve, dirname} from 'path';
import {DisplayNamesData, invariant} from '@formatjs/intl-utils';

// CLDR JSON types
type LanguageRawData = typeof import('cldr-localenames-full/main/en/languages.json')['main']['en']['localeDisplayNames']['languages'];
type RegionRawData = typeof import('cldr-localenames-full/main/en/territories.json')['main']['en']['localeDisplayNames']['territories'];
type ScriptRawData = typeof import('cldr-localenames-full/main/en/scripts.json')['main']['en']['localeDisplayNames']['scripts'];
type LocalePatternRawData = typeof import('cldr-localenames-full/main/en/localeDisplayNames.json')['main']['en']['localeDisplayNames']['localeDisplayPattern']['localePattern'];
type CurrencyRawData = typeof import('cldr-numbers-full/main/en/currencies.json')['main']['en']['numbers']['currencies'];
// -------------------------------------------------------------------------------------------------

const displayNamesLocales = getAllLocales();

export function getAllLocales() {
  return globSync('*/localeDisplayNames.json', {
    cwd: resolve(
      dirname(require.resolve('cldr-localenames-full/package.json')),
      './main'
    ),
  }).map(dirname);
}

function hasDisplayNames(locale: Locale): boolean {
  return displayNamesLocales.includes(locale);
}

function extractStyleData(
  cldrData: Record<string, string>
): Record<'long' | 'short' | 'narrow', Record<string, string>> {
  const longData: Record<string, string> = {};
  const shortData: Record<string, string> = {};
  const narrowData: Record<string, string> = {};
  for (const [key, value] of Object.entries(cldrData)) {
    if (key.includes('-alt-')) {
      // As of Jan 2020, there is no `-alt-narrow`.
      if (key.includes('-alt-narrow')) {
        narrowData[key.replace(/-alt-narrow.*/, '')] = value;
      } else if (key.includes('-alt-short')) {
        shortData[key.replace(/-alt-short.*/, '')] = value;
      }
      // Not sure why `-alt-long` exists. Ignore them for now.
    } else {
      longData[key] = value;
    }
  }
  return {long: longData, short: shortData, narrow: narrowData};
}

// Currency code -> {Property -> Value}.
function extractCurrencyStyleData(
  locale: string,
  cldrData: CurrencyRawData
): Record<'long' | 'short' | 'narrow', Record<string, string>> {
  const longData: Record<string, string> = {};
  for (const [currencyCode, value] of Object.entries(cldrData)) {
    // There does not seem to be narrow or short display names.
    const displayName = value.displayName;
    invariant(
      !!displayName,
      `displayName does not exist for currency ${currencyCode} of locale ${locale}.`
    );
    longData[currencyCode] = displayName;
  }
  return {long: longData, short: {}, narrow: {}};
}

function loadDisplayNames(locale: Locale): DisplayNamesData {
  const langData: LanguageRawData = require(`cldr-localenames-full/main/${locale}/languages.json`)
    .main[locale].localeDisplayNames.languages;
  const regionData: RegionRawData = require(`cldr-localenames-full/main/${locale}/territories.json`)
    .main[locale].localeDisplayNames.territories;
  const scriptData: ScriptRawData = require(`cldr-localenames-full/main/${locale}/scripts.json`)
    .main[locale].localeDisplayNames.scripts;
  const localePatternData: LocalePatternRawData = require(`cldr-localenames-full/main/${locale}/localeDisplayNames.json`)
    .main[locale].localeDisplayNames.localeDisplayPattern.localePattern;
  const currencyData: CurrencyRawData = require(`cldr-numbers-full/main/${locale}/currencies.json`)
    .main[locale].numbers.currencies;

  return {
    types: {
      language: extractStyleData(langData),
      region: extractStyleData(regionData),
      script: extractStyleData(scriptData),
      currency: extractCurrencyStyleData(locale, currencyData),
    },
    patterns: {
      // No support for alt variants
      locale: localePatternData,
    },
  };
}

export default generateFieldExtractorFn<DisplayNamesData>(
  loadDisplayNames,
  hasDisplayNames,
  getAllLocales()
);
