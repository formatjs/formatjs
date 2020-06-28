import {extractLists, getAllLocales} from './extract-list';
import {join} from 'path';
import {outputFileSync, outputJsonSync} from 'fs-extra';
import {ListPatternLocaleData} from '@formatjs/intl-utils';
import * as minimist from 'minimist';

const data = extractLists();
const langData = getAllLocales().reduce(
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

function main(args: minimist.ParsedArgs) {
  const {outDir, polyfillLocalesOutFile} = args;

  // Dist all locale files to dist/locale-data
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

  // Dist all locale files to dist/locale-data
  Object.keys(langData).forEach(function (lang) {
    outputJsonSync(join(outDir, lang + '.json'), langData[lang]);
  });

  // Aggregate all into ../polyfill-locales.js
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
}

if (require.main === module) {
  main(minimist(process.argv));
}
