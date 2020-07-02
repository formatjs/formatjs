import {extractDatesFields, getAllLocales} from './extract-dates';
import {join} from 'path';
const locales = getAllLocales();
import {outputFileSync, outputJSONSync} from 'fs-extra';
import {RawDateTimeLocaleData} from '../src/types';
import * as minimist from 'minimist';

const data = extractDatesFields();
const langData = locales.reduce(
  (all: Record<string, RawDateTimeLocaleData>, locale) => {
    if (!all[locale]) {
      all[locale] = {
        data: {
          [locale]: data[locale],
        },
        availableLocales: [locale],
      };
    } else {
      all[locale].data[locale] = data[locale];
      all[locale].availableLocales.push(locale);
    }

    if (locale === 'en-US-POSIX') {
      all[locale].availableLocales.push('en-US');
    }

    return all;
  },
  {}
);

function main(args: minimist.ParsedArgs) {
  const {outDir, testDataDir, test262MainFile} = args;
  if (outDir) {
    // Dist all locale files to locale-data
    Object.keys(langData).forEach(function (lang) {
      const destFile = join(outDir, lang + '.js');
      outputFileSync(
        destFile,
        `/* @generated */	
  // prettier-ignore
  if (Intl.DateTimeFormat && typeof Intl.DateTimeFormat.__addLocaleData === 'function') {
    Intl.DateTimeFormat.__addLocaleData(${JSON.stringify(langData[lang])})
  }`
      );
    });
  }

  // Dist all json locale files to testDataDir
  if (testDataDir) {
    Object.keys(langData).forEach(function (lang) {
      const destFile = join(testDataDir, lang + '.json');
      outputJSONSync(destFile, langData[lang]);
    });
  }

  if (test262MainFile) {
    outputFileSync(
      test262MainFile,
      `/* @generated */
// prettier-ignore
import {DateTimeFormat} from '../dist-es6';
import {defineProperty} from '@formatjs/intl-utils';
import allData from '../dist-es6/data';
defineProperty(Intl, 'DateTimeFormat', {value: DateTimeFormat});


Intl.DateTimeFormat.__addLocaleData(
${['ar', 'de', 'en', 'ja', 'ko', 'th', 'zh', 'zh-Hant', 'zh-Hans']
  .map(lang => JSON.stringify(langData[lang]))
  .join(',\n')}
)
Intl.DateTimeFormat.__addTZData(allData)
  `
    );
  }
}
if (require.main === module) {
  main(minimist(process.argv));
}
