import {
  extractAllNumbers,
  getAllNumbersLocales,
} from 'formatjs-extract-cldr-data';
import {
  SANCTIONED_UNITS,
  getAliasesByLang,
  getParentLocalesByLang,
  NumberLocaleData,
} from '@formatjs/intl-utils';
import {resolve, join} from 'path';
import {outputFileSync, outputJSONSync} from 'fs-extra';

function shortenUnit(unit: string) {
  return unit.replace(/^(.*?)-/, '');
}

const allLocaleDistDir = resolve(__dirname, '../dist/locale-data');

const numbersData = extractAllNumbers();

const langData = getAllNumbersLocales().reduce(
  (all: Record<string, NumberLocaleData>, locale) => {
    if (locale === 'en-US-POSIX') {
      locale = 'en-US';
    }
    const lang = locale.split('-')[0];
    const localeData = numbersData[locale];

    if (!all[lang]) {
      const aliases = getAliasesByLang(lang);
      const parentLocales = getParentLocalesByLang(lang);
      all[lang] = {
        data: {[locale]: localeData},
        availableLocales: [locale],
        aliases,
        parentLocales,
      };
    } else {
      if (localeData) {
        all[lang].data[locale] = localeData;
      }
      all[lang].availableLocales.push(locale);
    }

    return all;
  },
  {}
);

outputFileSync(
  resolve(__dirname, '../src/units-constants.ts'),
  `/* @generated */
// prettier-ignore
export type Unit =
  ${SANCTIONED_UNITS.map(unit => `'${shortenUnit(unit)}'`).join(' | ')}
`
);

// Dist all locale files to dist/locale-data
Object.keys(langData).forEach(function(lang) {
  const destFile = join(allLocaleDistDir, lang + '.js');
  outputFileSync(
    destFile,
    `/* @generated */
// prettier-ignore
if (Intl.NumberFormat && typeof Intl.NumberFormat.__addLocaleData === 'function') {
  Intl.NumberFormat.__addLocaleData(${JSON.stringify(langData[lang])})
}`
  );
});

// Dist all locale files to dist/locale-data
Object.keys(langData).forEach(function(lang) {
  const destFile = join(allLocaleDistDir, lang + '.json');
  outputJSONSync(destFile, langData[lang]);
});

// Aggregate all into src/locales.ts
outputFileSync(
  resolve(__dirname, '../src/locales.ts'),
  `/* @generated */
// prettier-ignore
import {UnifiedNumberFormat} from "./core";\n
UnifiedNumberFormat.__addLocaleData(${Object.keys(langData)
    .map(lang => JSON.stringify(langData[lang]))
    .join(',\n')});
export default UnifiedNumberFormat;
  `
);
