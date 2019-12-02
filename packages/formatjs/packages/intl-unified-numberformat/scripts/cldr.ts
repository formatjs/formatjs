import {
  extractAllUnits,
  getAllUnitsLocales,
  getAllCurrenciesLocales,
  extractAllCurrencies,
} from 'formatjs-extract-cldr-data';
import {
  SANCTIONED_UNITS,
  getAliasesByLang,
  getParentLocalesByLang,
  UnifiedNumberFormatLocaleData,
  UnitData,
  invariant,
  CurrencyData,
} from '@formatjs/intl-utils';
import {resolve, join} from 'path';
import {outputFileSync, outputJSONSync} from 'fs-extra';
import {isEqual, mapValues, pickBy} from 'lodash';

invariant(
  isEqual(getAllUnitsLocales().sort(), getAllCurrenciesLocales().sort()),
  'All unit locales differ from all currencies locales'
);

const unitData = extractAllUnits();
const currencyData = extractAllCurrencies();

function shortenUnit(unit: string) {
  return unit.replace(/^(.*?)-/, '');
}

const allLocaleDistDir = resolve(__dirname, '../dist/locale-data');

function getSanctionedUnitData(
  data?: Record<string, UnitData>
): Record<string, UnitData> | undefined {
  if (!data) {
    return undefined;
  }
  return SANCTIONED_UNITS.filter(unit => unit in data).reduce(
    (all: Record<string, UnitData>, unit) => {
      all[shortenUnit(unit)] = data[unit];
      return all;
    },
    {}
  );
}

function getCurrencyNarrowSymbolData(
  data?: Record<string, CurrencyData>
): Record<string, Pick<CurrencyData, 'narrowSymbol'>> | undefined {
  if (!data) {
    return undefined;
  }
  return mapValues(
    pickBy(data, x => x.narrowSymbol),
    x => ({narrowSymbol: x.narrowSymbol})
  );
}

const langData = getAllUnitsLocales().reduce(
  (all: Record<string, UnifiedNumberFormatLocaleData>, locale) => {
    if (locale === 'en-US-POSIX') {
      locale = 'en-US';
    }
    const lang = locale.split('-')[0];
    const sanctionedUnitData = getSanctionedUnitData(unitData[locale]);
    const narrowSymbolData = getCurrencyNarrowSymbolData(currencyData[locale]);
    const localeData = {
      units: sanctionedUnitData,
      currencies: narrowSymbolData,
    };

    if (!all[lang]) {
      const aliases = getAliasesByLang(lang);
      const parentLocales = getParentLocalesByLang(lang);
      all[lang] = {
        data: {[locale]: localeData},
        availableLocales: [locale],
        aliases,
        parentLocales,
      };
    } else {
      if (sanctionedUnitData) {
        all[lang].data[locale] = localeData;
      }
      all[lang].availableLocales.push(locale);
    }

    return all;
  },
  {}
);

outputFileSync(
  resolve(__dirname, '../src/units-constants.ts'),
  `/* @generated */
// prettier-ignore
export type Unit =
  ${SANCTIONED_UNITS.map(unit => `'${shortenUnit(unit)}'`).join(' | ')}
`
);

// Dist all locale files to dist/locale-data
Object.keys(langData).forEach(function(lang) {
  const destFile = join(allLocaleDistDir, lang + '.js');
  outputFileSync(
    destFile,
    `/* @generated */
// prettier-ignore
if (Intl.NumberFormat && typeof Intl.NumberFormat.__addLocaleData === 'function') {
  Intl.NumberFormat.__addLocaleData(${JSON.stringify(langData[lang])})
}`
  );
});

// Dist all locale files to dist/locale-data
Object.keys(langData).forEach(function(lang) {
  const destFile = join(allLocaleDistDir, lang + '.json');
  outputJSONSync(destFile, langData[lang]);
});

// Aggregate all into src/locales.ts
outputFileSync(
  resolve(__dirname, '../src/locales.ts'),
  `/* @generated */
// prettier-ignore
import {UnifiedNumberFormat} from "./core";\n
UnifiedNumberFormat.__addLocaleData(${Object.keys(langData)
    .map(lang => JSON.stringify(langData[lang]))
    .join(',\n')});
export default UnifiedNumberFormat;
  `
);
