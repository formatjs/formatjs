import {
  extractAllNumbers,
  extractAllCurrencies,
  extractAllUnits,
  locales,
} from 'formatjs-extract-cldr-data';
import {
  SANCTIONED_UNITS,
  getAliasesByLang,
  getParentLocalesByLang,
  removeUnitNamespace,
  RawNumberLocaleData,
} from '@formatjs/intl-utils';
import {resolve, join} from 'path';
import {outputFileSync, outputJSONSync} from 'fs-extra';

const allLocaleDistDir = resolve(__dirname, '../dist/locale-data');

const numbersData = extractAllNumbers();
const currenciesData = extractAllCurrencies();
const unitsData = extractAllUnits();

const langData = locales.reduce(
  (all: Record<string, RawNumberLocaleData>, locale) => {
    if (locale === 'en-US-POSIX') {
      locale = 'en-US';
    }
    const lang = locale.split('-')[0];

    if (!all[lang]) {
      const aliases = getAliasesByLang(lang);
      const parentLocales = getParentLocalesByLang(lang);
      all[lang] = {
        data: {
          [locale]: {
            units: unitsData[locale],
            currencies: currenciesData[locale],
            numbers: numbersData[locale],
          },
        },
        availableLocales: [locale],
        aliases,
        parentLocales,
      };
    } else {
      const localeData = (all[lang].data[locale] = {} as any);
      if (unitsData[locale]) {
        localeData.units = unitsData[locale];
      }

      if (currenciesData[locale]) {
        localeData.currencies = currenciesData[locale];
      }

      if (numbersData[locale]) {
        localeData.numbers = numbersData[locale];
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
  ${SANCTIONED_UNITS.map(unit => `'${removeUnitNamespace(unit)}'`).join(' | ')}
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
