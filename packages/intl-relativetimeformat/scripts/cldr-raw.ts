import {extractRelativeFields, getAllLocales} from './extract-relative';
import {join} from 'path';
import {outputJSONSync} from 'fs-extra';
import {RelativeTimeLocaleData} from '@formatjs/ecma402-abstract';
import minimist from 'minimist';

async function main(args: minimist.ParsedArgs) {
  const {outDir} = args;
  const locales = await getAllLocales();
  const rawData = await extractRelativeFields(locales);
  const langData = locales.reduce(
    (all: Record<string, RelativeTimeLocaleData>, locale) => {
      if (locale === 'en-US-POSIX') {
        all['en-US'] = {
          data: rawData[locale],
          locale: 'en-US',
        };
      } else {
        all[locale] = {
          data: rawData[locale],
          locale,
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
  (async () => main(minimist(process.argv)))();
}
