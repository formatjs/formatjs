/*
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
'use strict';
import * as Numbers from 'cldr-numbers-full/main/ar/numbers.json';
import {Locale} from './types';
import generateFieldExtractorFn, {
  collapseSingleValuePluralRule,
  PLURAL_RULES,
} from './utils';
import {sync as globSync} from 'glob';
import {resolve, dirname} from 'path';
import {getAllLocales} from './locales';
import {
  RawNumberData,
  SymbolsData,
  LDMLPluralRuleMap,
  DecimalFormatNum,
  RawCurrencyData,
} from '@formatjs/intl-utils';

const unitsLocales = globSync('*/numbers.json', {
  cwd: resolve(
    dirname(require.resolve('cldr-numbers-full/package.json')),
    './main'
  ),
}).map(dirname);

export type Numbers = typeof Numbers['main']['ar']['numbers'];

const COUNTS = [
  '1000',
  '10000',
  '100000',
  '1000000',
  '10000000',
  '100000000',
  '1000000000',
  '10000000000',
  '100000000000',
  '1000000000000',
  '10000000000000',
  '100000000000000',
] as Array<DecimalFormatNum>;

function reduceNumCount<
  T extends Numbers['decimalFormats-numberSystem-latn']['long']['decimalFormat']
>(d: T): Record<DecimalFormatNum, LDMLPluralRuleMap<string>> {
  return COUNTS.reduce(
    (all: Record<DecimalFormatNum, LDMLPluralRuleMap<string>>, num) => {
      all[num] = collapseSingleValuePluralRule(
        PLURAL_RULES.reduce(
          (all: LDMLPluralRuleMap<string>, pl) => {
            all[pl] = d[`${num}-count-${pl}` as '1000-count-one'];
            return all;
          },
          {other: d[`${num}-count-other` as '1000-count-other']}
        )
      );
      return all;
    },
    {} as Record<DecimalFormatNum, LDMLPluralRuleMap<string>>
  );
}

function extractNumbers(d: Numbers): RawNumberData {
  const nu =
    d.defaultNumberingSystem === 'latn'
      ? ['latn']
      : [d.defaultNumberingSystem, 'latn'];
  return {
    nu,
    symbols: nu.reduce((all: Record<string, SymbolsData>, ns) => {
      all[ns] = d[`symbols-numberSystem-${ns}` as 'symbols-numberSystem-latn'];
      return all;
    }, {}),
    percent: nu.reduce((all: RawNumberData['percent'], ns) => {
      all[ns] =
        d[
          `percentFormats-numberSystem-${ns}` as 'percentFormats-numberSystem-latn'
        ].standard;
      return all;
    }, {}),
    decimal: nu.reduce((all: RawNumberData['decimal'], ns) => {
      const decimalData =
        d[
          `decimalFormats-numberSystem-${ns}` as 'decimalFormats-numberSystem-latn'
        ];
      const longData = decimalData.long.decimalFormat;
      const shortData = decimalData.short.decimalFormat;
      all[ns] = {
        long: reduceNumCount(longData),
        short: reduceNumCount(shortData),
      };
      return all;
    }, {}),
    currency: nu.reduce((all: RawNumberData['currency'], ns) => {
      const {
        currencySpacing,
        standard,
        accounting,
        'unitPattern-count-other': unitPattern,
        short,
      } = d[
        `currencyFormats-numberSystem-${ns}` as 'currencyFormats-numberSystem-latn'
      ];
      all[ns] = {
        currencySpacing: {
          beforeInsertBetween: currencySpacing.beforeCurrency.insertBetween,
          afterInsertBetween: currencySpacing.afterCurrency.insertBetween,
        },
        standard,
        accounting,
        unitPattern,
      } as RawCurrencyData;
      if (short) {
        all[ns].short = reduceNumCount(short.standard);
      }
      return all;
    }, {}),
  };
}

function loadNumbers(locale: Locale): RawNumberData {
  try {
    return extractNumbers(
      (require(`cldr-numbers-full/main/${locale}/numbers.json`) as typeof Numbers)
        .main[locale as 'ar'].numbers
    );
  } catch (e) {
    console.error('Issue processing numbers data for ' + locale);
    throw e;
  }
}

function hasNumbers(locale: Locale): boolean {
  return unitsLocales.includes(locale);
}

export function generateDataForLocales(
  locales: string[] = getAllLocales()
): Record<string, RawNumberData> {
  return locales.reduce((all: Record<string, RawNumberData>, locale) => {
    all[locale] = loadNumbers(locale);
    return all;
  }, {});
}

export default generateFieldExtractorFn<RawNumberData>(
  loadNumbers,
  hasNumbers,
  getAllLocales()
);
