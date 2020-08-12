import {generateDataForLocales as extractCurrencies} from './extract-currencies';
import {generateDataForLocales as extractUnits} from './extract-units';
import {generateDataForLocales as extractNumbers} from './extract-numbers';
import {RawNumberLocaleData} from '@formatjs/intl-utils';
import {join} from 'path';
import {outputJSONSync} from 'fs-extra';
import * as AVAILABLE_LOCALES from 'cldr-core/availableLocales.json';
import * as minimist from 'minimist';

function main(args: minimist.ParsedArgs) {
  const {outDir} = args;
  // Dist all locale files to locale-data

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
  Object.keys(allData).forEach(function (locale) {
    outputJSONSync(join(outDir, `${locale}.json`), allData[locale]);
  });
}

if (require.main === module) {
  main(minimist(process.argv));
}
