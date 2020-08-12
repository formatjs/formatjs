import {join, basename} from 'path';
import {outputFileSync, copyFileSync, readFileSync} from 'fs-extra';
import * as minimist from 'minimist';
import {sync as globSync} from 'glob';

function main(args: minimist.ParsedArgs) {
  const {
    cldrFolder,
    locales: localesToGen = '',
    outDir,
    test262MainFile,
    testOutFile,
  } = args;
  const allFiles = globSync(join(cldrFolder, '*.json'));
  allFiles.sort();
  const locales = localesToGen
    ? localesToGen.split(',')
    : allFiles.map(f => basename(f, '.json'));
  if (outDir) {
    // Dist all locale files to locale-data (JS)
    for (const locale of locales) {
      const data = readFileSync(join(cldrFolder, `${locale}.json`));
      const destFile = join(outDir, locale + '.js');
      outputFileSync(
        destFile,
        `/* @generated */	
  // prettier-ignore
  if (Intl.DateTimeFormat && typeof Intl.DateTimeFormat.__addLocaleData === 'function') {
    Intl.DateTimeFormat.__addLocaleData(${data})
  }`
      );
    }
  }

  // Dist all json locale files to testDataDir
  if (testOutFile) {
    copyFileSync(join(cldrFolder, `${locales[0]}.json`), testOutFile);
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
import allData from './src/data/all-tz';
defineProperty(Intl, 'DateTimeFormat', {value: DateTimeFormat});

Intl.DateTimeFormat.__addLocaleData(
  ${allData.join(',\n')}
)
Intl.DateTimeFormat.__addTZData(allData)
  `
    );
  }
}
if (require.main === module) {
  main(minimist(process.argv));
}
