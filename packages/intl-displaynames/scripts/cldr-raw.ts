import {extractDisplayNames, getAllLocales} from './extract-displaynames';
import {join} from 'path';
import {outputJSONSync} from 'fs-extra';
import {DisplayNamesLocaleData} from '@formatjs/ecma402-abstract';
import minimist from 'minimist';

function main(args: minimist.ParsedArgs) {
  const {outDir} = args;
  const locales: string[] = getAllLocales();
  const data = extractDisplayNames(locales);
  const allData = locales.reduce(
    (all: Record<string, DisplayNamesLocaleData>, locale) => {
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

  Object.keys(allData).forEach(function (locale) {
    outputJSONSync(join(outDir, `${locale}.json`), allData[locale]);
  });
}

if (require.main === module) {
  main(minimist(process.argv));
}
