import {
  extractAllDisplayNames,
  getAllDisplayNamesLocales,
} from 'formatjs-extract-cldr-data';
import {resolve, join} from 'path';
import {outputFileSync, outputJSONSync} from 'fs-extra';
import {
  DisplayNamesLocaleData,
  getAliasesByLang,
  getParentLocalesByLang,
} from '@formatjs/intl-utils';

const data = extractAllDisplayNames();
const allData = getAllDisplayNamesLocales().reduce(
  (all: Record<string, DisplayNamesLocaleData>, locale) => {
    const lang = locale.split('-')[0];
    const aliases = getAliasesByLang(lang);
    const parentLocales = getParentLocalesByLang(lang);
    if (!all[locale]) {
      all[locale] = {
        data: {
          [locale]: data[locale],
        },
        availableLocales: [locale],
        aliases,
        parentLocales,
      };
    }

    return all;
  },
  {}
);

const allLocaleDistDir = resolve(__dirname, '../dist/locale-data');

// Dist all locale files to dist/locale-data (JS)
Object.keys(allData).forEach(function(lang) {
  const destFile = join(allLocaleDistDir, lang + '.js');
  outputFileSync(
    destFile,
    `/* @generated */
// prettier-ignore
if (Intl.DisplayNames && typeof Intl.DisplayNames.__addLocaleData === 'function') {
  Intl.DisplayNames.__addLocaleData(${JSON.stringify(allData[lang], null, 2)})
}`
  );
});

// Dist all locale files to dist/locale-data (JSON)
Object.keys(allData).forEach(function(locale) {
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
