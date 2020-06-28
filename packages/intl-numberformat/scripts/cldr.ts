import {generateDataForLocales as extractCurrencies} from './extract-currencies';
import {generateDataForLocales as extractUnits} from './extract-units';
import {generateDataForLocales as extractNumbers} from './extract-numbers';
import {RawNumberLocaleData} from '@formatjs/intl-utils';
import {join} from 'path';
import {outputFileSync, outputJSONSync} from 'fs-extra';
import * as AVAILABLE_LOCALES from 'cldr-core/availableLocales.json';
import * as minimist from 'minimist';

const numbersData = extractNumbers();
const currenciesData = extractCurrencies();
const unitsData = extractUnits();

const allData = AVAILABLE_LOCALES.availableLocales.full.reduce(
  (all: Record<string, RawNumberLocaleData>, locale) => {
    if (!all[locale]) {
      all[locale] = {
        data: {
          [locale]: {
            units: unitsData[locale],
            currencies: currenciesData[locale],
            numbers: numbersData[locale],
            nu: numbersData[locale].nu,
          },
        },
        availableLocales: [locale],
      };
    }

    return all;
  },
  {}
);

function main(args: minimist.ParsedArgs) {
  const {outDir, testDataDir, test262MainFile} = args;
  // Dist all locale files to dist/locale-data
  Object.keys(allData).forEach(function (locale) {
    const destFile = join(outDir, locale + '.js');
    outputFileSync(
      destFile,
      `/* @generated */
// prettier-ignore
if (Intl.NumberFormat && typeof Intl.NumberFormat.__addLocaleData === 'function') {
  Intl.NumberFormat.__addLocaleData(${JSON.stringify(allData[locale])})
}`
    );
  });

  // Dist all locale files to dist/locale-data
  Object.keys(allData).forEach(function (locale) {
    const destFile = join(testDataDir, locale + '.json');
    outputJSONSync(destFile, allData[locale]);
  });

  // For test262
  // Only a subset of locales
  outputFileSync(
    test262MainFile,
    `
import './polyfill-force';
import '@formatjs/intl-getcanonicallocales/polyfill';
if (Intl.NumberFormat && typeof Intl.NumberFormat.__addLocaleData === 'function') {
  Intl.NumberFormat.__addLocaleData(
    ${['ar', 'de', 'en', 'ja', 'ko', 'th', 'zh', 'zh-Hant', 'zh-Hans']
      .map(locale => JSON.stringify(allData[locale]))
      .join(',\n')});
}
`
  );
}

if (require.main === module) {
  main(minimist(process.argv));
}
