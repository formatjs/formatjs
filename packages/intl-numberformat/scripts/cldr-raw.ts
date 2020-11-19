import {generateDataForLocales as extractCurrencies} from './extract-currencies';
import {generateDataForLocales as extractUnits} from './extract-units';
import {generateDataForLocales as extractNumbers} from './extract-numbers';
import {RawNumberLocaleData} from '@formatjs/ecma402-abstract';
import {join} from 'path';
import {outputJSONSync} from 'fs-extra';
import * as AVAILABLE_LOCALES from 'cldr-core/availableLocales.json';
import minimist from 'minimist';

const MISSING_DATA_LOCALES = new Set([
  'ff-Adlm',
  'ff-Adlm-BF',
  'ff-Adlm-CM',
  'ff-Adlm-GH',
  'ff-Adlm-GM',
  'ff-Adlm-GW',
  'ff-Adlm-LR',
  'ff-Adlm-MR',
  'ff-Adlm-NE',
  'ff-Adlm-NG',
  'ff-Adlm-SL',
  'ff-Adlm-SN',
  'ks-Arab',
  'mai',
  'mni',
  'mni-Beng',
  'ms-ID',
  'pcm',
  'sat',
  'sat-Olck',
  'sd-Arab',
  'sd-Deva',
  'su',
  'su-Latn',
]);

async function main(args: minimist.ParsedArgs) {
  const {outDir} = args;
  // Dist all locale files to locale-data
  const locales = AVAILABLE_LOCALES.availableLocales.full.filter(
    l => !MISSING_DATA_LOCALES.has(l)
  );
  const [numbersData, currenciesData, unitsData] = await Promise.all([
    extractNumbers(locales),
    extractCurrencies(locales),
    extractUnits(locales),
  ]);

  const allData = locales.reduce(
    (all: Record<string, RawNumberLocaleData>, locale) => {
      if (!all[locale]) {
        all[locale] = {
          data: {
            units: unitsData[locale],
            currencies: currenciesData[locale],
            numbers: numbersData[locale],
            nu: numbersData[locale].nu,
          },
          locale,
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
  (async () => main(minimist(process.argv)))();
}
