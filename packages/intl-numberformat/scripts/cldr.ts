import {join, basename} from 'path';
import {outputFileSync, copyFileSync, readFileSync} from 'fs-extra';
import * as minimist from 'minimist';
import {sync as globSync} from 'fast-glob';

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
if (Intl.NumberFormat && typeof Intl.NumberFormat.__addLocaleData === 'function') {
  Intl.NumberFormat.__addLocaleData(${data})
}`
      );
    }
  }

  // Dist all locale files to tests/locale-data
  if (testOutFile) {
    copyFileSync(join(cldrFolder, `${locales[0]}.json`), testOutFile);
  }

  // For test262
  // Only a subset of locales
  if (test262MainFile) {
    const allData = [];
    for (const locale of locales) {
      allData.push(readFileSync(join(cldrFolder, `${locale}.json`)));
    }
    outputFileSync(
      test262MainFile,
      `
// @generated
// @ts-nocheck
// prettier-ignore
import './polyfill-force';
import '@formatjs/intl-getcanonicallocales/polyfill';
if (Intl.NumberFormat && typeof Intl.NumberFormat.__addLocaleData === 'function') {
  Intl.NumberFormat.__addLocaleData(
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
