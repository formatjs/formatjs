import {
  extractAllDisplayNames,
  getAllDisplayNamesLocales,
} from 'formatjs-extract-cldr-data';
import {join} from 'path';
import {outputFile} from 'fs-extra';
import {
  DisplayNamesLocaleData,
  getAliasesByLang,
  getParentLocalesByLang,
} from '@formatjs/intl-utils';
import * as minimist from 'minimist';
import * as assert from 'assert';

const data = extractAllDisplayNames();
const allData = getAllDisplayNamesLocales().reduce(
  (all: Record<string, DisplayNamesLocaleData>, locale) => {
    const lang = locale.split('-')[0];
    const aliases = getAliasesByLang(lang);
    const parentLocales = getParentLocalesByLang(lang);
    if (!all[locale]) {
      all[locale] = {
        data: {
          [locale]: data[locale],
        },
        availableLocales: [locale],
        aliases,
        parentLocales,
      };
    }

    return all;
  },
  {}
);

function main(args: minimist.ParsedArgs) {
  const {outDir, polyfillLocalesOut} = args;
  const langs: string[] = args.langs.split(',');
  assert(langs.length === Object.keys(allData).length, 'Mismatch langs');
  for (const lang of langs) {
    assert(lang in allData, `We don't have data for ${lang}`);
  }
  // Dist all locale files to dist/locale-data (JS)
  return Promise.all(
    langs
      .map(lang =>
        outputFile(
          join(outDir, lang + '.js'),
          `/* @generated */
// prettier-ignore
if (Intl.DisplayNames && typeof Intl.DisplayNames.__addLocaleData === 'function') {
  Intl.DisplayNames.__addLocaleData(${JSON.stringify(allData[lang])})
}`
        )
      )
      .concat([
        outputFile(
          polyfillLocalesOut,
          `/* @generated */
  // prettier-ignore
  require('./polyfill')
  if (Intl.DisplayNames && typeof Intl.DisplayNames.__addLocaleData === 'function') {
    Intl.DisplayNames.__addLocaleData(
      ${langs.map(locale => JSON.stringify(allData[locale])).join(',\n')});
  }
  `
        ),
      ])
  );
}

if (require.main === module) {
  main(minimist(process.argv));
}
