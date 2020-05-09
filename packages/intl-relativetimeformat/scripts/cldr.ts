import {
  extractAllRelativeFields,
  getAllDateFieldsLocales,
} from 'formatjs-extract-cldr-data';
import {join} from 'path';
import {outputFile} from 'fs-extra';
import {
  RelativeTimeLocaleData,
  getAliasesByLang,
  getParentLocalesByLang,
} from '../../intl-utils';
import * as minimist from 'minimist';
import * as assert from 'assert';

const data = extractAllRelativeFields();
const langData = getAllDateFieldsLocales().reduce(
  (all: Record<string, RelativeTimeLocaleData>, locale) => {
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
if (Intl.RelativeTimeFormat && typeof Intl.RelativeTimeFormat.__addLocaleData === 'function') {
  Intl.RelativeTimeFormat.__addLocaleData(${JSON.stringify(langData[lang])})
}`
        )
      )
      .concat([
        outputFile(
          polyfillLocalesOut,
          `/* @generated */
// prettier-ignore
require('./polyfill')
if (Intl.RelativeTimeFormat && typeof Intl.RelativeTimeFormat.__addLocaleData === 'function') {
  Intl.RelativeTimeFormat.__addLocaleData(
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
