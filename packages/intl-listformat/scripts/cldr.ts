import {extractLists, getAllLocales} from './extract-list';
import {join} from 'path';
import {outputFileSync, outputJsonSync} from 'fs-extra';
import {ListPatternLocaleData} from '@formatjs/intl-utils';
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
  const data = extractLists(locales);
  const langData = locales.reduce(
    (all: Record<string, ListPatternLocaleData>, locale) => {
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
  // Dist all locale files to locale-data
  outDir &&
    Object.keys(langData).forEach(function (lang) {
      const destFile = join(outDir, lang + '.js');
      outputFileSync(
        destFile,
        `/* @generated */	
// prettier-ignore
if (Intl.ListFormat && typeof Intl.ListFormat.__addLocaleData === 'function') {
  Intl.ListFormat.__addLocaleData(${JSON.stringify(langData[lang])})
}`
      );
    });

  // Dist all locale files to tests/locale-data
  testOutFile &&
    outputJsonSync(
      testOutFile,
      langData[locales[0] === 'en-US-POSIX' ? 'en-US' : locales[0]]
    );

  // Aggregate all into ../polyfill-locales.js
  polyfillLocalesOutFile &&
    outputFileSync(
      polyfillLocalesOutFile,
      `/* @generated */
// prettier-ignore
require('./polyfill')
if (Intl.ListFormat && typeof Intl.ListFormat.__addLocaleData === 'function') {
  Intl.ListFormat.__addLocaleData(
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
if (Intl.ListFormat && typeof Intl.ListFormat.__addLocaleData === 'function') {
  Intl.ListFormat.__addLocaleData(
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
