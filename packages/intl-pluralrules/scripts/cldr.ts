import {outputFileSync as outputFile} from 'fs-extra';
import * as serialize from 'serialize-javascript';
import {
  PluralRulesLocaleData,
  getAliasesByLang,
  getParentLocalesByLang,
} from '@formatjs/intl-utils';
import * as minimist from 'minimist';
import {join} from 'path';
const Compiler = require('make-plural-compiler');
Compiler.load(
  require('cldr-core/supplemental/plurals.json'),
  require('cldr-core/supplemental/ordinals.json')
);

const allData: Record<string, PluralRulesLocaleData> = {};

function main(args: minimist.ParsedArgs) {
  const {langs, outDir, polyfillLocalesOut} = args;
  langs.split(',').forEach((lang: string) => {
    let compiler, fn;
    compiler = new Compiler(lang, {cardinals: true, ordinals: true});
    fn = compiler.compile();
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
  });

  return Promise.all(
    Object.keys(allData)
      .map(lang =>
        outputFile(
          join(outDir, `${lang}.js`),
          `/* @generated */
// prettier-ignore
if (Intl.PluralRules && typeof Intl.PluralRules.__addLocaleData === 'function') {
Intl.PluralRules.__addLocaleData(${serialize(allData[lang])})
}
`
        )
      )
      .concat([
        // Aggregate all into ../polyfill-locales.js
        outputFile(
          polyfillLocalesOut,
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
        ),
      ])
  );
}

if (require.main === module) {
  main(minimist(process.argv));
}
