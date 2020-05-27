import {extractDisplayNames, getAllLocales} from './extract-displaynames';
import {resolve, join} from 'path';
import {outputFileSync, outputJSONSync} from 'fs-extra';
import {DisplayNamesLocaleData} from '@formatjs/intl-utils';
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

const allLocaleDistDir = resolve(__dirname, '../dist/locale-data');

// Dist all locale files to dist/locale-data (JS)
Object.keys(allData).forEach(function (lang) {
  const destFile = join(allLocaleDistDir, lang + '.js');
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
  const destFile = join(allLocaleDistDir, locale + '.json');
  outputJSONSync(destFile, allData[locale]);
});

// Aggregate all into ../polyfill-locales.js
outputFileSync(
  resolve(__dirname, '../polyfill-locales.js'),
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
  resolve(__dirname, '../dist-es6/polyfill-locales-for-test262.js'),
  `
import './polyfill';
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
