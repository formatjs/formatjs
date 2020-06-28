import {extractDisplayNames, getAllLocales} from './extract-displaynames';
import {join} from 'path';
import {outputFileSync, outputJSONSync} from 'fs-extra';
import {DisplayNamesLocaleData} from '@formatjs/intl-utils';
import * as minimist from 'minimist';

const locales = getAllLocales();
const data = extractDisplayNames();
const allData = locales.reduce(
  (all: Record<string, DisplayNamesLocaleData>, locale) => {
    if (!all[locale]) {
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

function main(args: minimist.ParsedArgs) {
  const {outDir, polyfillLocalesOutFile, test262MainFile} = args;

  // Dist all locale files to dist/locale-data (JS)
  Object.keys(allData).forEach(function (lang) {
    const destFile = join(outDir, lang + '.js');
    outputFileSync(
      destFile,
      `/* @generated */
// prettier-ignore
if (Intl.DisplayNames && typeof Intl.DisplayNames.__addLocaleData === 'function') {
  Intl.DisplayNames.__addLocaleData(${JSON.stringify(allData[lang])})
}`
    );
  });

  // Dist all locale files to dist/locale-data (JSON)
  Object.keys(allData).forEach(function (locale) {
    const destFile = join(outDir, locale + '.json');
    outputJSONSync(destFile, allData[locale]);
  });

  // Aggregate all into ../polyfill-locales.js
  outputFileSync(
    polyfillLocalesOutFile,
    `/* @generated */
// prettier-ignore
require('./polyfill')
if (Intl.DisplayNames && typeof Intl.DisplayNames.__addLocaleData === 'function') {
  Intl.DisplayNames.__addLocaleData(
    ${Object.keys(allData)
      .map(locale => JSON.stringify(allData[locale]))
      .join(',\n')});
}
`
  );

  // For test262
  // Only a subset of locales
  outputFileSync(
    test262MainFile,
    `
import './polyfill-force';
if (Intl.DisplayNames && typeof Intl.DisplayNames.__addLocaleData === 'function') {
  Intl.DisplayNames.__addLocaleData(
    ${[
      'ar',
      'de',
      'en',
      'en-US-POSIX',
      'ja',
      'ko',
      'th',
      'zh',
      'zh-Hant',
      'zh-Hans',
    ]
      .map(locale => JSON.stringify(allData[locale]))
      .join(',\n')});
}
`
  );
}

if (require.main === module) {
  main(minimist(process.argv));
}
