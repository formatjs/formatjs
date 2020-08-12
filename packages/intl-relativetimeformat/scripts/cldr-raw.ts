import {extractRelativeFields, getAllLocales} from './extract-relative';
import {join} from 'path';
import {outputJSONSync} from 'fs-extra';
import {RelativeTimeLocaleData} from '@formatjs/intl-utils';
import * as minimist from 'minimist';

function main(args: minimist.ParsedArgs) {
  const {outDir} = args;
  const locales = getAllLocales();
  const rawData = extractRelativeFields(locales);
  const langData = locales.reduce(
    (all: Record<string, RelativeTimeLocaleData>, locale) => {
      if (locale === 'en-US-POSIX') {
        all['en-US'] = {
          data: {
            ['en-US']: rawData[locale],
          },
          availableLocales: ['en-US'],
        };
      } else {
        all[locale] = {
          data: {
            [locale]: rawData[locale],
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
