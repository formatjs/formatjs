import {
  extractAllListPatterns,
  getAllListLocales,
} from 'formatjs-extract-cldr-data';
import {resolve, join} from 'path';
import {outputFileSync} from 'fs-extra';
import {ListPatternLocaleData} from '@formatjs/intl-utils';

const data = extractAllListPatterns();
const langData = getAllListLocales().reduce(
  (all: Record<string, ListPatternLocaleData>, locale) => {
    const lang = locale.split('-')[0];
    if (!all[lang]) {
      all[lang] = {
        data: {
          [locale]: data[locale],
        },
        availableLocales: [locale],
      };
    } else {
      all[lang].data[locale] = data[locale];
      all[lang].availableLocales.push(locale);
    }

    if (locale === 'en-US-POSIX') {
      all[lang].availableLocales.push('en-US');
    }

    return all;
  },
  {}
);

const allLocaleDistDir = resolve(__dirname, '../dist/locale-data');

// Dist all locale files to dist/locale-data
Object.keys(langData).forEach(function (lang) {
  const destFile = join(allLocaleDistDir, lang + '.js');
  outputFileSync(
    destFile,
    `/* @generated */	
// prettier-ignore
if (Intl.ListFormat && typeof Intl.ListFormat.__addLocaleData === 'function') {
  Intl.ListFormat.__addLocaleData(${JSON.stringify(langData[lang])})
}`
  );
});

// Aggregate all into src/locales.ts
outputFileSync(
  resolve(__dirname, '../src/locales.ts'),
  `/* @generated */	
// prettier-ignore  
import IntlListFormat from "./core";\n
IntlListFormat.__addLocaleData(${Object.keys(langData)
    .map(lang => JSON.stringify(langData[lang]))
    .join(',\n')});	
export default IntlListFormat;	
  `
);

// Aggregate all into ../polyfill-locales.js
outputFileSync(
  resolve(__dirname, '../polyfill-locales.js'),
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
