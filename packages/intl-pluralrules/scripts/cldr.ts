import {join} from 'path';
import {outputFileSync} from 'fs-extra';
import * as serialize from 'serialize-javascript';
import {PluralRulesLocaleData} from '@formatjs/intl-utils';
import * as plurals from 'cldr-core/supplemental/plurals.json';
import * as minimist from 'minimist';

const Compiler = require('make-plural-compiler');
Compiler.load(
  require('cldr-core/supplemental/plurals.json'),
  require('cldr-core/supplemental/ordinals.json')
);

const languages = Object.keys(plurals.supplemental['plurals-type-cardinal']);
const allData: Record<string, PluralRulesLocaleData> = {};
languages.forEach(lang => {
  let compiler, fn;
  try {
    compiler = new Compiler(lang, {cardinals: true, ordinals: true});
    fn = compiler.compile();
  } catch (e) {
    // Ignore
    return;
  }
  allData[lang] = {
    data: {
      [lang]: {
        categories: compiler.categories,
        fn,
      },
    },
    availableLocales: [lang],
  };
});

function main(args: minimist.ParsedArgs) {
  const {outDir, test262MainFile, testDataDir, polyfillLocalesOutFile} = args;

  outDir &&
    languages.forEach(lang => {
      outputFileSync(
        join(outDir, `${lang}.js`),
        `/* @generated */
// prettier-ignore
if (Intl.PluralRules && typeof Intl.PluralRules.__addLocaleData === 'function') {
  Intl.PluralRules.__addLocaleData(${serialize(allData[lang])})
}
`
      );
    });

  testDataDir &&
    languages.forEach(lang => {
      outputFileSync(
        join(testDataDir, `${lang}.js`),
        `/* @generated */
// prettier-ignore
module.exports = ${serialize(allData[lang])}
`
      );
    });

  // Aggregate all into ../polyfill-locales.js
  polyfillLocalesOutFile &&
    outputFileSync(
      polyfillLocalesOutFile,
      `/* @generated */
// prettier-ignore
require('./polyfill')
if (Intl.PluralRules && typeof Intl.PluralRules.__addLocaleData === 'function') {
  Intl.PluralRules.__addLocaleData(
${Object.keys(allData)
  .map(lang => serialize(allData[lang]))
  .join(',\n')}
  )
}
`
    );

  // Aggregate all into ../test262-main.js
  test262MainFile &&
    outputFileSync(
      test262MainFile,
      `/* @generated */
// prettier-ignore
// @ts-nocheck
import './polyfill-force'
if (Intl.PluralRules && typeof Intl.PluralRules.__addLocaleData === 'function') {
Intl.PluralRules.__addLocaleData(
${Object.keys(allData)
  .map(lang => serialize(allData[lang]))
  .join(',\n')}
)
}
`
    );
}
if (require.main === module) {
  main(minimist(process.argv));
}
