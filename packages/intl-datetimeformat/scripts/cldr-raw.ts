import {extractDatesFields, getAllLocales} from './extract-dates';
import {join} from 'path';
import {outputJSONSync} from 'fs-extra';
import {RawDateTimeLocaleData} from '../src/types';
import * as minimist from 'minimist';

function main(args: minimist.ParsedArgs) {
  const {outDir} = args;
  const locales = getAllLocales();
  const data = extractDatesFields(locales);
  const langData = locales.reduce(
    (all: Record<string, RawDateTimeLocaleData>, locale) => {
      if (locale === 'en-US-POSIX') {
        all['en-US'] = {
          data: {
            ['en-US']: data[locale],
          },
          availableLocales: ['en-US'],
        };
      } else {
        all[locale] = {
          data: {
            [locale]: data[locale],
          },
          availableLocales: [locale],
        };
      }

      return all;
    },
    {}
  );
  Object.keys(langData).forEach(function (locale) {
    outputJSONSync(join(outDir, `${locale}.json`), langData[locale]);
  });
}
if (require.main === module) {
  main(minimist(process.argv));
}
