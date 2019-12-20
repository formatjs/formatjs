import {
  extractAllNumbers,
  extractAllCurrencies,
  extractAllUnits,
  locales,
  extractCurrencyDigits,
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
      all[lang].data[locale] = {
        units: unitsData[locale],
        currencies: currenciesData[locale],
        numbers: numbersData[locale],
      };
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

// Aggregate all into ../polyfill-locales.js
outputFileSync(
  resolve(__dirname, '../polyfill-locales.js'),
  `/* @generated */
// prettier-ignore
require('./polyfill')
if (Intl.NumberFormat && typeof Intl.NumberFormat.__addLocaleData === 'function') {
  Intl.NumberFormat.__addLocaleData(
    ${Object.keys(langData)
      .map(lang => JSON.stringify(langData[lang]))
      .join(',\n')});
}
`
);

// Output currency digits file
outputJSONSync(
  resolve(__dirname, '../src/currency-digits.json'),
  extractCurrencyDigits()
);

// For test262
outputFileSync(
  resolve(__dirname, '../dist-es6/polyfill-locales.js'),
  `
import './polyfill';
if (Intl.NumberFormat && typeof Intl.NumberFormat.__addLocaleData === 'function') {
  Intl.NumberFormat.__addLocaleData(
    ${Object.keys(langData)
      .map(lang => JSON.stringify(langData[lang]))
      .join(',\n')});
}
`
);
