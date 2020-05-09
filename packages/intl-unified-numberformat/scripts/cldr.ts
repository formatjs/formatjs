import {
  getAliasesByLang,
  getParentLocalesByLang,
  RawNumberLocaleData,
} from '@formatjs/intl-utils';
import {
  generateCurrencyDataForLocales,
  generateUnitDataForLocales,
  generateNumberDataForLocales,
} from 'formatjs-extract-cldr-data';
import {join} from 'path';
import {outputFile, outputJSON} from 'fs-extra';
import * as minimist from 'minimist';

const numbersData = generateNumberDataForLocales();
const currenciesData = generateCurrencyDataForLocales();
const unitsData = generateUnitDataForLocales();

function main(args: minimist.ParsedArgs) {
  const {outDir, polyfillLocalesOut} = args;
  const locales: string[] = args.locales.split(',');
  const allData = locales.reduce(
    (all: Record<string, RawNumberLocaleData>, locale: string) => {
      const lang = locale.split('-')[0];
      const aliases = getAliasesByLang(lang);
      const parentLocales = getParentLocalesByLang(lang);
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
          aliases,
          parentLocales,
        };
      }

      return all;
    },
    {}
  );

  return Promise.all(
    locales
      .map(locale => {
        return Promise.all([
          outputFile(
            join(outDir, `${locale}.js`),
            `/* @generated */
  // prettier-ignore
  if (Intl.NumberFormat && typeof Intl.NumberFormat.__addLocaleData === 'function') {
    Intl.NumberFormat.__addLocaleData(${JSON.stringify(allData[locale])})
  }`
          ),
          outputJSON(join(outDir, `${locale}.json`), allData[locale]),
        ]) as Promise<any>;
      })
      .concat([
        // Aggregate all into ../polyfill-locales.js
        outputFile(
          polyfillLocalesOut,
          `/* @generated */
// prettier-ignore
require('./polyfill')
if (Intl.NumberFormat && typeof Intl.NumberFormat.__addLocaleData === 'function') {
Intl.NumberFormat.__addLocaleData(
  ${Object.keys(allData)
    .map(locale => JSON.stringify(allData[locale]))
    .join(',\n')});
}
`
        ),
      ])
  );
}

if (require.main === module) {
  main(minimist(process.argv));
}
