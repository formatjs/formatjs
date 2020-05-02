import {
  generateCurrencyDataForLocales,
  generateUnitDataForLocales,
  generateNumberDataForLocales,
  locales,
  extractCurrencyDigits,
  extractNumberingSystemNames,
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

// Generate an array of 10 characters with consecutive codepoint, starting from `starCharCode`.
function generateDigitChars(startCharCode: number): string[] {
  const arr = new Array<string>(10);
  for (let i = 0; i < 10; i++) {
    arr[i] = String.fromCharCode(startCharCode + i);
  }
  return arr;
}

// https://tc39.es/ecma402/#table-numbering-system-digits
const digitMapping: Record<string, string[]> = {
  arab: generateDigitChars(0x660),
  arabext: generateDigitChars(0x6f0),
  bali: generateDigitChars(0xb50),
  beng: generateDigitChars(0x9e6),
  deva: generateDigitChars(0x966),
  fullwide: generateDigitChars(0xf10),
  gujr: generateDigitChars(0xae6),
  guru: generateDigitChars(0xa66),
  khmr: generateDigitChars(0x7e0),
  knda: generateDigitChars(0xce6),
  laoo: generateDigitChars(0xed0),
  // There is NO need to generate latn since it is already the default!
  // latn: generateDigitChars(0x030),
  limb: generateDigitChars(0x946),
  mlym: generateDigitChars(0xd66),
  mong: generateDigitChars(0x810),
  mymr: generateDigitChars(0x040),
  orya: generateDigitChars(0xb66),
  tamldec: generateDigitChars(0xbe6),
  telu: generateDigitChars(0xc66),
  thai: generateDigitChars(0xe50),
  tibt: generateDigitChars(0xf20),
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

outputJSONSync(
  resolve(__dirname, '../src/data/digit-mapping.json'),
  digitMapping
);

outputFileSync(
  resolve(__dirname, '../src/data/units-constants.ts'),
  `/* @generated */
// prettier-ignore
export type Unit =
  ${SANCTIONED_UNITS.map(unit => `'${removeUnitNamespace(unit)}'`).join(' | ')}
`
);

// Dist all locale files to dist/locale-data
Object.keys(allData).forEach(function (locale) {
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
Object.keys(allData).forEach(function (locale) {
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
  resolve(__dirname, '../src/data/currency-digits.json'),
  extractCurrencyDigits()
);

// Output numbering systems file
outputJSONSync(
  resolve(__dirname, '../src/data/numbering-systems.json'),
  extractNumberingSystemNames()
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
