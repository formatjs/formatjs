import {extractDisplayNames, getAllLocales} from './extract-displaynames';
import {join} from 'path';
import {outputJSONSync} from 'fs-extra';
import {DisplayNamesLocaleData} from '@formatjs/ecma402-abstract';
import minimist from 'minimist';

async function main(args: minimist.ParsedArgs) {
  const {outDir} = args;
  const locales: string[] = await getAllLocales();
  const data = await extractDisplayNames(locales);
  const allData = locales.reduce(
    (all: Record<string, DisplayNamesLocaleData>, locale) => {
      if (locale === 'en-US-POSIX') {
        all['en-US'] = {
          data: data[locale],
          locale: 'en-US',
        };
      } else {
        all[locale] = {
          data: data[locale],
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
