import {getAllLanguages} from 'formatjs-extract-cldr-data';
import {resolve} from 'path';
import {outputFileSync} from 'fs-extra';
import * as serialize from 'serialize-javascript';
const Compiler = require('make-plural-compiler');
Compiler.load(
  require('cldr-core/supplemental/plurals.json'),
  require('cldr-core/supplemental/ordinals.json')
);

const languages = getAllLanguages();
const allData: Record<string, any> = {};
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
    locale: lang,
    categories: compiler.categories,
    fn,
  };
  outputFileSync(
    resolve(__dirname, `../dist/locale-data/${lang}.js`),
    `/* @generated */
// prettier-ignore
if (Intl.PluralRules && typeof Intl.PluralRules.__addLocaleData === 'function') {
  Intl.PluralRules.__addLocaleData(${serialize(allData[lang])})
}
`
  );
});

// Aggregate all into src/locales.ts
outputFileSync(
  resolve(__dirname, '../src/locales.js'),
  `/* @generated */
// @ts-ignore-file
// prettier-ignore
const {PluralRules: IntlPluralRules} = require('./core')
${Object.keys(allData)
  .map(lang => `IntlPluralRules.__addLocaleData(${serialize(allData[lang])})`)
  .join('\n')}
exports.PluralRules = IntlPluralRules
`
);
