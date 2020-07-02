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
  const {outDir, testDataDir, polyfillLocalesOutFile, test262MainFile} = args;

  if (outDir) {
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
  }

  if (testDataDir) {
    // Dist all locale files to tests/locale-data (JSON)
    Object.keys(allData).forEach(function (locale) {
      const destFile = join(testDataDir, locale + '.json');
      outputJSONSync(destFile, allData[locale]);
    });
  }

  if (polyfillLocalesOutFile) {
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
  }

  // For test262
  // Only a subset of locales
  test262MainFile &&
    outputFileSync(
      test262MainFile,
      `
import '../dist-es6/polyfill-force';
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
