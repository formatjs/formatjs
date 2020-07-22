import {extractDatesFields, getAllLocales} from './extract-dates';
import {join} from 'path';
import {outputFileSync, outputJSONSync} from 'fs-extra';
import {RawDateTimeLocaleData} from '../src/types';
import * as minimist from 'minimist';

function main(args: minimist.ParsedArgs) {
  const {outDir, locales: localesToGen, testOutFile, test262MainFile} = args;
  const locales: string[] = localesToGen
    ? localesToGen.split(',')
    : getAllLocales();
  const data = extractDatesFields(locales);
  const langData = locales.reduce(
    (all: Record<string, RawDateTimeLocaleData>, locale) => {
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
  if (testOutFile) {
    outputJSONSync(testOutFile, langData[locales[0]]);
  }

  if (test262MainFile) {
    outputFileSync(
      test262MainFile,
      `/* @generated */
// @ts-nocheck
import './polyfill-force'
import allData from './src/data/all-tz';
defineProperty(Intl, 'DateTimeFormat', {value: DateTimeFormat});

Intl.DateTimeFormat.__addLocaleData(
${locales.map(lang => JSON.stringify(langData[lang])).join(',\n')}
)
Intl.DateTimeFormat.__addTZData(allData)
  `
    );
  }
}
if (require.main === module) {
  main(minimist(process.argv));
}
