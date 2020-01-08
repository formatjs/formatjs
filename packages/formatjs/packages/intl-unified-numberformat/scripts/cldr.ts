import {
  generateCurrencyDataForLocales,
  generateUnitDataForLocales,
  generateNumberDataForLocales,
  locales,
  extractCurrencyDigits,
} from 'formatjs-extract-cldr-data';
import {
  SANCTIONED_UNITS,
  getAliasesByLang,
  getParentLocalesByLang,
  removeUnitNamespace,
  RawNumberLocaleData,
} from '@formatjs/intl-utils';
import {resolve, join} from 'path';
import {outputFileSync, outputJSONSync} from 'fs-extra';

const allLocaleDistDir = resolve(__dirname, '../dist/locale-data');

const numbersData = generateNumberDataForLocales();
const currenciesData = generateCurrencyDataForLocales();
const unitsData = generateUnitDataForLocales();

const allData = locales.reduce(
  (all: Record<string, RawNumberLocaleData>, locale) => {
    const lang = locale.split('-')[0];
    const aliases = getAliasesByLang(lang);
    const parentLocales = getParentLocalesByLang(lang);
    if (!all[locale]) {
      all[locale] = {
        data: {
          [locale]: {
            units: unitsData[locale],
            currencies: currenciesData[locale],
            numbers: numbersData[locale],
            nu: numbersData[locale].nu,
          },
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

function generateContinuousILND(startChar: string): string[] {
  const startCharCode = startChar.charCodeAt(0);
  const arr = new Array<string>(10);
  for (let i = 0; i < 10; i++) {
    arr[i] = String.fromCharCode(startCharCode + i);
  }
  return arr;
}

// https://tc39.es/proposal-unified-intl-numberformat/section11/numberformat_proposed_out.html#table-numbering-system-digits
const ILND: Record<string, string[]> = (function() {
  return {
    arab: generateContinuousILND('\u0660'),
    arabext: generateContinuousILND('\u06f0'),
    bali: generateContinuousILND('\u1b50'),
    beng: generateContinuousILND('\u09e6'),
    deva: generateContinuousILND('\u0966'),
    fullwide: generateContinuousILND('\uff10'),
    gujr: generateContinuousILND('\u0ae6'),
    guru: generateContinuousILND('\u0a66'),
    khmr: generateContinuousILND('\u17e0'),
    knda: generateContinuousILND('\u0ce6'),
    laoo: generateContinuousILND('\u0ed0'),
    latn: generateContinuousILND('\u0030'),
    limb: generateContinuousILND('\u1946'),
    mlym: generateContinuousILND('\u0d66'),
    mong: generateContinuousILND('\u1810'),
    mymr: generateContinuousILND('\u1040'),
    orya: generateContinuousILND('\u0b66'),
    tamldec: generateContinuousILND('\u0be6'),
    telu: generateContinuousILND('\u0c66'),
    thai: generateContinuousILND('\u0e50'),
    tibt: generateContinuousILND('\u0f20'),
    hanidec: [
      '\u3007',
      '\u4e00',
      '\u4e8c',
      '\u4e09',
      '\u56db',
      '\u4e94',
      '\u516d',
      '\u4e03',
      '\u516b',
      '\u4e5d',
    ],
  };
})();

outputJSONSync(resolve(__dirname, '../src/ilnd-numbers.json'), ILND);

outputFileSync(
  resolve(__dirname, '../src/units-constants.ts'),
  `/* @generated */
// prettier-ignore
export type Unit =
  ${SANCTIONED_UNITS.map(unit => `'${removeUnitNamespace(unit)}'`).join(' | ')}
`
);

// Dist all locale files to dist/locale-data
Object.keys(allData).forEach(function(locale) {
  const destFile = join(allLocaleDistDir, locale + '.js');
  outputFileSync(
    destFile,
    `/* @generated */
// prettier-ignore
if (Intl.NumberFormat && typeof Intl.NumberFormat.__addLocaleData === 'function') {
  Intl.NumberFormat.__addLocaleData(${JSON.stringify(allData[locale])})
}`
  );
});

// Dist all locale files to dist/locale-data
Object.keys(allData).forEach(function(locale) {
  const destFile = join(allLocaleDistDir, locale + '.json');
  outputJSONSync(destFile, allData[locale]);
});

// Aggregate all into ../polyfill-locales.js
outputFileSync(
  resolve(__dirname, '../polyfill-locales.js'),
  `/* @generated */
// prettier-ignore
require('./polyfill')
if (Intl.NumberFormat && typeof Intl.NumberFormat.__addLocaleData === 'function') {
  Intl.NumberFormat.__addLocaleData(
    ${Object.keys(allData)
      .map(locale => JSON.stringify(allData[locale]))
      .join(',\n')});
}
`
);

// Output currency digits file
outputJSONSync(
  resolve(__dirname, '../src/currency-digits.json'),
  extractCurrencyDigits()
);

// For test262
// Only a subset of locales
outputFileSync(
  resolve(__dirname, '../dist-es6/polyfill-locales.js'),
  `
import './polyfill';
if (Intl.NumberFormat && typeof Intl.NumberFormat.__addLocaleData === 'function') {
  Intl.NumberFormat.__addLocaleData(
    ${['ar', 'de', 'en', 'ja', 'ko', 'th', 'zh', 'zh-Hant', 'zh-Hans']
      .map(locale => JSON.stringify(allData[locale]))
      .join(',\n')});
}
`
);
