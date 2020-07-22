import {extractDisplayNames, getAllLocales} from './extract-displaynames';
import {join} from 'path';
import {outputFileSync, outputJSONSync} from 'fs-extra';
import {DisplayNamesLocaleData} from '@formatjs/intl-utils';
import * as minimist from 'minimist';

function main(args: minimist.ParsedArgs) {
  const {
    outDir,
    locales: localesToGen,
    testOutFile,
    polyfillLocalesOutFile,
    test262MainFile,
  } = args;
  const locales: string[] = localesToGen
    ? localesToGen.split(',')
    : getAllLocales();
  const data = extractDisplayNames(locales);
  const allData = locales.reduce(
    (all: Record<string, DisplayNamesLocaleData>, locale) => {
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
    // Dist all locale files to locale-data (JS)
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

  if (testOutFile) {
    outputJSONSync(testOutFile, allData[locales[0]]);
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
      `// @generated
// @ts-nocheck
import './polyfill-force';
if (Intl.DisplayNames && typeof Intl.DisplayNames.__addLocaleData === 'function') {
  Intl.DisplayNames.__addLocaleData(
    ${Object.keys(allData)
      .map(locale => JSON.stringify(allData[locale]))
      .join(',\n')});
}
`
    );
}

if (require.main === module) {
  main(minimist(process.argv));
}
