import {extractRelativeFields, getAllLocales} from './extract-relative';
import {join} from 'path';
import {outputFileSync, outputJSONSync} from 'fs-extra';
import {RelativeTimeLocaleData} from '@formatjs/intl-utils';
import * as minimist from 'minimist';

const locales = getAllLocales();
const data = extractRelativeFields();
const langData = locales.reduce(
  (all: Record<string, RelativeTimeLocaleData>, locale) => {
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
  const {outDir, testDataDir, test262MainFile, polyfillLocalesOutFile} = args;

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
  testDataDir &&
    Object.keys(langData).forEach(function (lang) {
      const destFile = join(testDataDir, lang + '.json');
      outputJSONSync(destFile, langData[lang]);
    });

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
// prettier-ignore
require('../dist-es6/polyfill-force')
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
