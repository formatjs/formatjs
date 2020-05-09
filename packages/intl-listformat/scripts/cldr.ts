import {
  extractAllListPatterns,
  getAllListLocales,
} from 'formatjs-extract-cldr-data';
import {join} from 'path';
import {outputFile} from 'fs-extra';
import {
  ListPatternLocaleData,
  getAliasesByLang,
  getParentLocalesByLang,
} from '@formatjs/intl-utils';
import * as minimist from 'minimist';
import * as assert from 'assert';

const data = extractAllListPatterns();
const langData = getAllListLocales().reduce(
  (all: Record<string, ListPatternLocaleData>, locale) => {
    const lang = locale.split('-')[0];
    if (!all[lang]) {
      const aliases = getAliasesByLang(lang);
      const parentLocales = getParentLocalesByLang(lang);
      all[lang] = {
        data: {
          [locale]: data[locale],
        },
        availableLocales: [locale],
        aliases,
        parentLocales,
      };
    } else {
      all[lang].data[locale] = data[locale];
      all[lang].availableLocales.push(locale);
    }

    if (locale === 'en-US-POSIX') {
      all[lang].availableLocales.push('en-US');
    }

    return all;
  },
  {}
);

function main(args: minimist.ParsedArgs) {
  const {outDir, polyfillLocalesOut} = args;
  const langs: string[] = args.langs.split(',');
  assert(langs.length === Object.keys(langData).length, 'Mismatch langs');
  for (const lang of langs) {
    assert(lang in langData, `We don't have data for ${lang}`);
  }
  // Dist all locale files to dist/locale-data
  return Promise.all(
    langs
      .map(lang =>
        outputFile(
          join(outDir, lang + '.js'),
          `/* @generated */	
// prettier-ignore
if (Intl.ListFormat && typeof Intl.ListFormat.__addLocaleData === 'function') {
  Intl.ListFormat.__addLocaleData(${JSON.stringify(langData[lang])})
}`
        )
      )
      .concat([
        // Aggregate all into ../polyfill-locales.js
        outputFile(
          polyfillLocalesOut,
          `/* @generated */
// prettier-ignore
require('./polyfill')
if (Intl.ListFormat && typeof Intl.ListFormat.__addLocaleData === 'function') {
  Intl.ListFormat.__addLocaleData(
${langs.map(lang => JSON.stringify(langData[lang])).join(',\n')}
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
