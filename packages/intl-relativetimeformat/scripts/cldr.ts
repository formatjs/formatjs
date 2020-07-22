import {extractRelativeFields, getAllLocales} from './extract-relative';
import {join} from 'path';
import {outputFileSync, outputJSONSync} from 'fs-extra';
import {RelativeTimeLocaleData} from '@formatjs/intl-utils';
import * as minimist from 'minimist';

function main(args: minimist.ParsedArgs) {
  const {
    outDir,
    locales: localesToGen,
    testOutFile,
    test262MainFile,
    polyfillLocalesOutFile,
  } = args;
  const locales: string[] = localesToGen
    ? localesToGen.split(',')
    : getAllLocales();
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
  // Dist all locale files to locale-data
  outDir &&
    Object.keys(langData).forEach(function (lang) {
      const destFile = join(outDir, lang + '.js');
      outputFileSync(
        destFile,
        `/* @generated */	
// prettier-ignore
if (Intl.RelativeTimeFormat && typeof Intl.RelativeTimeFormat.__addLocaleData === 'function') {
  Intl.RelativeTimeFormat.__addLocaleData(${JSON.stringify(langData[lang])})
}`
      );
    });

  // Dist all json locale files to tests/locale-data
  testOutFile && outputJSONSync(testOutFile, langData[locales[0]]);

  polyfillLocalesOutFile &&
    outputFileSync(
      polyfillLocalesOutFile,
      `/* @generated */
// prettier-ignore
require('./polyfill')
if (Intl.RelativeTimeFormat && typeof Intl.RelativeTimeFormat.__addLocaleData === 'function') {
  Intl.RelativeTimeFormat.__addLocaleData(
${Object.keys(langData)
  .map(lang => JSON.stringify(langData[lang]))
  .join(',\n')}
  )
}
`
    );

  test262MainFile &&
    outputFileSync(
      test262MainFile,
      `/* @generated */
// @ts-nocheck
import './polyfill-force'
if (Intl.RelativeTimeFormat && typeof Intl.RelativeTimeFormat.__addLocaleData === 'function') {
  Intl.RelativeTimeFormat.__addLocaleData(
${Object.keys(langData)
  .map(lang => JSON.stringify(langData[lang]))
  .join(',\n')}
  )
}
`
    );
}

if (require.main === module) {
  main(minimist(process.argv));
}
