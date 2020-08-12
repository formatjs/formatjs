import {join, basename} from 'path';
import {outputFileSync, copyFileSync, readFileSync} from 'fs-extra';
import {sync as globSync} from 'fast-glob';
import * as minimist from 'minimist';

function main(args: minimist.ParsedArgs) {
  const {
    cldrFolder,
    locales: localesToGen = '',
    outDir,
    polyfillLocalesOutFile,
    test262MainFile,
    testOutFile,
  } = args;
  const allFiles = globSync(join(cldrFolder, '*.json'));
  allFiles.sort();
  const locales = localesToGen
    ? localesToGen.split(',')
    : allFiles.map(f => basename(f, '.json'));
  // Dist all locale files to locale-data
  if (outDir) {
    // Dist all locale files to locale-data (JS)
    for (const locale of locales) {
      const data = readFileSync(join(cldrFolder, `${locale}.json`));
      const destFile = join(outDir, locale + '.js');
      outputFileSync(
        destFile,
        `/* @generated */	
// prettier-ignore
if (Intl.ListFormat && typeof Intl.ListFormat.__addLocaleData === 'function') {
  Intl.ListFormat.__addLocaleData(${data})
}`
      );
    }
  }

  if (testOutFile) {
    copyFileSync(join(cldrFolder, `${locales[0]}.json`), testOutFile);
  }

  if (polyfillLocalesOutFile) {
    // Aggregate all into ../polyfill-locales.js
    const allData = [];
    for (const locale of locales) {
      allData.push(readFileSync(join(cldrFolder, `${locale}.json`)));
    }
    outputFileSync(
      polyfillLocalesOutFile,
      `/* @generated */
// prettier-ignore
require('./polyfill')
if (Intl.ListFormat && typeof Intl.ListFormat.__addLocaleData === 'function') {
  Intl.ListFormat.__addLocaleData(
    ${allData.join(',\n')}
  )
}
`
    );
  }

  if (test262MainFile) {
    const allData = [];
    for (const locale of locales) {
      allData.push(readFileSync(join(cldrFolder, `${locale}.json`)));
    }
    outputFileSync(
      test262MainFile,
      `/* @generated */
// @ts-nocheck
import './polyfill-force'
if (Intl.ListFormat && typeof Intl.ListFormat.__addLocaleData === 'function') {
  Intl.ListFormat.__addLocaleData(
    ${allData.join(',\n')}
  )
}
`
    );
  }
}

if (require.main === module) {
  main(minimist(process.argv));
}
