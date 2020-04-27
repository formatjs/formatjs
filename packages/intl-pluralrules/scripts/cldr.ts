import {getAllLanguages} from 'formatjs-extract-cldr-data';
import {resolve} from 'path';
import {outputFileSync} from 'fs-extra';
import * as serialize from 'serialize-javascript';
import {
  PluralRulesLocaleData,
  getAliasesByLang,
  getParentLocalesByLang,
} from '@formatjs/intl-utils';
const Compiler = require('make-plural-compiler');
Compiler.load(
  require('cldr-core/supplemental/plurals.json'),
  require('cldr-core/supplemental/ordinals.json')
);

const languages = getAllLanguages();
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
    aliases: getAliasesByLang(lang),
    parentLocales: getParentLocalesByLang(lang),
    availableLocales: [lang],
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

// Aggregate all into ../polyfill-locales.js
outputFileSync(
  resolve(__dirname, '../polyfill-locales.js'),
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

// For test262
outputFileSync(
  resolve(__dirname, '../dist-es6/polyfill-locales.js'),
  `
import './polyfill';
if (Intl.PluralRules && typeof Intl.PluralRules.__addLocaleData === 'function') {
  Intl.PluralRules.__addLocaleData(
${Object.keys(allData)
  .map(lang => serialize(allData[lang]))
  .join(',\n')}
  )
}
`
);
