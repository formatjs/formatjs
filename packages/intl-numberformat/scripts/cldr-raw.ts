import {generateDataForLocales as extractCurrencies} from './extract-currencies';
import {generateDataForLocales as extractUnits} from './extract-units';
import {generateDataForLocales as extractNumbers} from './extract-numbers';
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
  const locales = AVAILABLE_LOCALES.availableLocales.full.filter(l => {
    try {
      return (
        !MISSING_DATA_LOCALES.has(l) &&
        (Intl as any).getCanonicalLocales(l).length
      );
    } catch (e) {
      console.warn(`Invalid locale ${l}`);
      return false;
    }
  });
  const [numbersData, currenciesData, unitsData] = await Promise.all([
    extractNumbers(locales),
    extractCurrencies(locales),
    extractUnits(locales),
  ]);

  for (let locale of locales) {
    const d = {
      units: unitsData[locale],
      currencies: currenciesData[locale],
      numbers: numbersData[locale],
      nu: numbersData[locale].nu,
    };
    if (locale === 'en-US-POSIX') {
      locale = 'en-US';
    }
    outputJSONSync(join(outDir, `${locale}.json`), {
      data: d,
      locale,
    });
  }
}

if (require.main === module) {
  (async () => main(minimist(process.argv)))();
}
