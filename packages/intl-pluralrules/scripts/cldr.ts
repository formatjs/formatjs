import {join, basename} from 'path';
import {outputFileSync, readFileSync} from 'fs-extra';
import * as minimist from 'minimist';
import {sync as globSync} from 'fast-glob';

function main(args: minimist.ParsedArgs) {
  const {
    cldrFolder,
    locales: localesToGen = '',
    outDir,
    polyfillLocalesOutFile,
    test262MainFile,
    testOutFile,
  } = args;
  const allFiles = globSync(join(cldrFolder, '*.js'));
  allFiles.sort();
  const locales = localesToGen
    ? localesToGen.split(',')
    : allFiles.map(f => basename(f, '.js'));

  if (outDir) {
    // Dist all locale files to locale-data (JS)
    for (const locale of locales) {
      const data = readFileSync(join(cldrFolder, `${locale}.js`));
      const destFile = join(outDir, locale + '.js');
      outputFileSync(
        destFile,
        `/* @generated */
// prettier-ignore
if (Intl.PluralRules && typeof Intl.PluralRules.__addLocaleData === 'function') {
  Intl.PluralRules.__addLocaleData(${data})
}
`
      );
    }
  }

  if (testOutFile) {
    outputFileSync(
      testOutFile,
      `/* @generated */
// prettier-ignore
// @ts-nocheck
export default ${readFileSync(join(cldrFolder, `${locales[0]}.js`))}
`
    );
  }

  // Aggregate all into ../polyfill-locales.js
  if (polyfillLocalesOutFile) {
    // Aggregate all into ../polyfill-locales.js
    const allData = [];
    for (const locale of locales) {
      allData.push(readFileSync(join(cldrFolder, `${locale}.js`)));
    }
    outputFileSync(
      polyfillLocalesOutFile,
      `/* @generated */
// prettier-ignore
require('./polyfill')
if (Intl.PluralRules && typeof Intl.PluralRules.__addLocaleData === 'function') {
  Intl.PluralRules.__addLocaleData(
    ${allData.join(',\n')}
  )
}
`
    );
  }

  // Aggregate all into ../test262-main.js
  if (test262MainFile) {
    const allData = [];
    for (const locale of locales) {
      allData.push(readFileSync(join(cldrFolder, `${locale}.js`)));
    }
    outputFileSync(
      test262MainFile,
      `/* @generated */
// prettier-ignore
// @ts-nocheck
import './polyfill-force'
if (Intl.PluralRules && typeof Intl.PluralRules.__addLocaleData === 'function') {
  Intl.PluralRules.__addLocaleData(
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
