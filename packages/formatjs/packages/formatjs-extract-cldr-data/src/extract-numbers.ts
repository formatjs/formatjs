/*
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
'use strict';
import * as Numbers from 'cldr-numbers-full/main/en/numbers.json';
import * as Currencies from 'cldr-numbers-full/main/en/currencies.json';
import {Locale} from './types';
import generateFieldExtractorFn from './utils';
import {sync as globSync} from 'glob';
import {resolve, dirname} from 'path';
import {
  SANCTIONED_UNITS,
  UnitData,
  NumberLocaleData,
  SignPattern,
  SignDisplayPattern,
  LDMLPluralRule,
  NumberILD,
  CurrencyPattern,
} from '@formatjs/intl-utils';

const numbersLocales = globSync('*/numbers.json', {
  cwd: resolve(
    dirname(require.resolve('cldr-numbers-full/package.json')),
    './main'
  ),
}).map(dirname);

export type NumbersData = typeof Numbers['main']['en']['numbers'];
export type CurrenciesData = typeof Currencies['main']['en']['numbers']['currencies'];

function generateCurrencyILD(d: CurrenciesData): NumberILD['currencySymbols'] {
  return Object.keys(d).reduce((all: NumberILD['currencySymbols'], k) => {
    const data = d[k as 'USD'];
    all[k] = {
      currencySymbol: data.symbol,
      currencyNarrowSymbol: data['symbol-alt-narrow'] || data.symbol,
      currencyName: (['zero', 'one', 'two', 'few', 'many', 'other'] as Array<
        LDMLPluralRule
      >).reduce((names: Record<LDMLPluralRule, string>, ldml) => {
        const key = `displayName-count-${ldml}`;
        if (key in data) {
          names[ldml] = data[key as 'displayName'];
        }
        return names;
      }, {} as Record<LDMLPluralRule, string>),
    };
    return all;
  }, {});
}

function generateContinuousILND(startChar: string): NumberLocaleData['ilnd'] {
  const startCharCode = startChar.charCodeAt(0);
  const arr = new Array<string>(10) as NumberLocaleData['ilnd'];
  for (let i = 0; i < 10; i++) {
    arr[i] = String.fromCharCode(startCharCode + i);
  }
  return arr;
}

// https://tc39.es/proposal-unified-intl-numberformat/section11/numberformat_proposed_out.html#table-numbering-system-digits
const ILND = (function() {
  return {
    arab: generateContinuousILND('\u0660'),
    arabext: generateContinuousILND('\u06f0'),
    bali: generateContinuousILND('\u1b50'),
    beng: generateContinuousILND('\u09e6'),
    deva: generateContinuousILND('\u0966'),
    fullwide: generateContinuousILND('\uff10'),
    gujr: generateContinuousILND('\u0ae6'),
    guru: generateContinuousILND('\u0a66'),
    khmr: generateContinuousILND('\17e0'),
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

// https://tc39.es/proposal-unified-intl-numberformat/section11/numberformat_proposed_out.html#sec-intl.numberformat-internal-slots
function extractNumberPattern(d: NumbersData, c: CurrenciesData): NumberLocaleData {
  return {
    nu:
      d.defaultNumberingSystem === 'latn'
        ? ['latn']
        : [d.defaultNumberingSystem, 'latn'],
    patterns: {
      decimal: extractDecimalPattern(d),
      percent: extractPercentPattern(d),
      currency: extractDecimalPattern(d),
      unit: extractDecimalPattern(d),
    },
    ild: {
      ...extractCompactILD(d),
      symbols: d['symbols-numberSystem-latn'],
      currencySymbols: generateCurrencyILD(c)
    },
    ilnd: ILND[d['defaultNumberingSystem'] as 'latn'] || ILND['latn'],
  };
}

// Credit: https://github.com/andyearnshaw/Intl.js/blob/master/scripts/utils/reduce.js
// Matches CLDR number patterns, e.g. #,##0.00, #,##,##0.00, #,##0.##, #E0, etc.
const NUMBER_PATTERN = /[#0](?:[\.,][#0]+)*/g;

function extractSignPattern(
  pattern: string,
  signDisplay: keyof SignDisplayPattern = 'auto',
  currencyToken:
    | 'currencyCode'
    | 'currencySymbol'
    | 'currencyNarrowSymbol'
    | 'currencyName' = 'currencyCode'
): SignPattern {
  const patterns = pattern.split(';');
  let [positivePattern, negativePattern] = patterns.map(p =>
    p
      .replace(NUMBER_PATTERN, '{number}')
      .replace('+', '{plusSign}')
      .replace('-', '{minusSign}')
      .replace('%', '{percentSign}')
      .replace('¤', `{${currencyToken}}`)
      .replace('E', '{scientificSeparator}')
  );
  let zeroPattern = positivePattern;
  switch (signDisplay) {
    case 'always':
      positivePattern = zeroPattern = positivePattern.includes('{plusSign}')
        ? positivePattern
        : `{plusSign}${positivePattern}`;
      negativePattern = negativePattern.includes('{minusSign}')
        ? negativePattern
        : `{minusSign}${negativePattern}`;
      break;
    case 'exceptZero':
      positivePattern = positivePattern.includes('{plusSign}')
        ? positivePattern
        : `{plusSign}${positivePattern}`;
      negativePattern = negativePattern.includes('{minusSign}')
        ? negativePattern
        : `{minusSign}${negativePattern}`;
      break;
    case 'never':
      positivePattern = zeroPattern = positivePattern.replace('{plusSign}', '');
      negativePattern = negativePattern.replace('{minusSign}', '');
      break;
  }
  return {
    positivePattern,
    negativePattern,
    zeroPattern,
  };
}

function extractDecimalFormatILD(
  data:
    | NumbersData['decimalFormats-numberSystem-latn']['short']['decimalFormat']
    | NumbersData['decimalFormats-numberSystem-latn']['long']['decimalFormat']
    | NumbersData['currencyFormats-numberSystem-latn']['short']['standard']
): Record<string, Record<LDMLPluralRule, string>> {
  return (Object.keys(data) as Array<keyof typeof data>).reduce(
    (all: Record<string, Record<LDMLPluralRule, string>>, k) => {
      const [type, _, ldml] = k.split('-');
      const decimalPattern = all[type] || {};
      decimalPattern[ldml as LDMLPluralRule] = data[k]
        .replace('¤', '')
        .replace(/0+\s?/g, '');
      all[type] = decimalPattern;
      return all;
    },
    {}
  );
}

function extractCompactILD(
  d: NumbersData
): Pick<NumberILD, 'decimal' | 'currency'> {
  return {
    decimal: {
      compactShort: extractDecimalFormatILD(
        d['decimalFormats-numberSystem-latn']['short']['decimalFormat']
      ),
      compactLong: extractDecimalFormatILD(
        d['decimalFormats-numberSystem-latn']['long']['decimalFormat']
      ),
    },
    currency: {
      compactShort: extractDecimalFormatILD(
        d['currencyFormats-numberSystem-latn']['short']['standard']
      ),
    },
  };
}

function extractDecimalPattern(d: NumbersData): SignDisplayPattern {
  return (['auto', 'always', 'never', 'exceptZero'] as Array<
    keyof SignDisplayPattern
  >).reduce((all: SignDisplayPattern, k) => {
    all[k] = {
      standard: extractSignPattern(
        d['decimalFormats-numberSystem-latn']['standard'],
        k
      ),
      scientific: extractSignPattern(
        d['scientificFormats-numberSystem-latn']['standard'],
        k
      ),
      compactShort: extractSignPattern(
        d['decimalFormats-numberSystem-latn']['short']['decimalFormat'][
          '1000-count-one'
        ].replace(/([^0#\s]+)/, '{compactSymbol}'),
        k
      ),
      compactLong: extractSignPattern(
        d['decimalFormats-numberSystem-latn']['long']['decimalFormat'][
          '1000-count-one'
        ].replace(/([^0#\s]+)/, '{compactName}'),
        k
      ),
    };
    return all;
  }, {} as SignDisplayPattern);
}

function extractPercentPattern(d: NumbersData): SignDisplayPattern {
  return (['auto', 'always', 'never', 'exceptZero'] as Array<
    keyof SignDisplayPattern
  >).reduce((all: SignDisplayPattern, k) => {
    all[k] = {
      standard: extractSignPattern(
        d['percentFormats-numberSystem-latn']['standard'],
        k
      ),
      scientific: extractSignPattern(
        d['percentFormats-numberSystem-latn']['standard'],
        k
      ),
      compactShort: extractSignPattern(
        d['percentFormats-numberSystem-latn']['standard'],
        k
      ),
      compactLong: extractSignPattern(
        d['percentFormats-numberSystem-latn']['standard'],
        k
      ),
    };
    return all;
  }, {} as SignDisplayPattern);
}

function extractCurrencyPattern(d: NumbersData): CurrencyPattern {
  return (['auto', 'always', 'never', 'exceptZero'] as Array<
    keyof SignDisplayPattern
  >).reduce((all: SignDisplayPattern, k) => {
    all[k] = {
      standard: extractSignPattern(
        d['currencyFormats-numberSystem-latn']['standard'],
        k
      ),
      scientific: extractSignPattern(
        d['percentFormats-numberSystem-latn']['standard'],
        k
      ),
      compactShort: extractSignPattern(
        d['percentFormats-numberSystem-latn']['standard'],
        k
      ),
      compactLong: extractSignPattern(
        d['percentFormats-numberSystem-latn']['standard'],
        k
      ),
    };
    return all;
  }, {} as SignDisplayPattern);
}

export function getAllLocales() {
  return numbersLocales;
}

function loadNumbers(locale: Locale): Record<string, UnitData> {
  const numbers = (require(`cldr-numbers-full/main/${locale}/numbers.json`) as typeof Numbers)
    .main[locale as 'en'].numbers;
  return SANCTIONED_UNITS.reduce((all: Record<string, UnitData>, unit) => {
    if (!units.long[unit as 'digital-bit']) {
      throw new Error(`${unit} does not have any data`);
    }
    all[unit] = {
      displayName: units.long[unit as 'digital-bit'].displayName,
      long: extractUnitPattern(units.long[unit as 'volume-gallon']),
      short: extractUnitPattern(units.short[unit as 'volume-gallon']),
      narrow: extractUnitPattern(units.narrow[unit as 'volume-gallon']),
    };
    return all;
  }, {});
}

function hasNumbers(locale: Locale): boolean {
  return numbersLocales.includes(locale);
}

export default generateFieldExtractorFn<Record<string, UnitData>>(
  loadNumbers,
  hasNumbers,
  getAllLocales()
);
