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

function generateLocaleData(locale: string): PluralRulesLocaleData | undefined {
  let compiler, fn;
  try {
    compiler = new Compiler(locale, {cardinals: true, ordinals: true});
    fn = compiler.compile();
  } catch (e) {
    // Ignore
    return;
  }
  return {
    data: {
      [locale]: {
        categories: compiler.categories,
        fn,
      },
    },
    availableLocales: [locale],
  };
}

function main(args: minimist.ParsedArgs) {
  const {outDir} = args;

  const data: Record<string, PluralRulesLocaleData> = {};
  const locales = languages;

  locales.forEach(locale => {
    const d = generateLocaleData(locale);
    if (d) {
      data[locale] = d;
    }
  });

  languages.forEach(lang => {
    outputFileSync(join(outDir, `${lang}.js`), serialize(data[lang]));
  });
}
if (require.main === module) {
  main(minimist(process.argv));
}
