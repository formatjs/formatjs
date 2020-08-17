/*
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
import * as NumbersData from 'cldr-numbers-full/main/ar/numbers.json';
import * as numberingSystems from 'cldr-core/supplemental/numberingSystems.json';
import {
  RawNumberData,
  SymbolsData,
  LDMLPluralRuleMap,
  DecimalFormatNum,
  RawCurrencyData,
  invariant,
} from '@formatjs/intl-utils';
import * as AVAILABLE_LOCALES from 'cldr-core/availableLocales.json';
import {collapseSingleValuePluralRule, PLURAL_RULES} from './utils';

export type Numbers = typeof NumbersData['main']['ar']['numbers'];

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

      invariant(
        decimalData.standard.includes('.'),
        `Decimal pattern does not contain decimal point: ${decimalData.standard}`
      );

      all[ns] = {
        standard: decimalData.standard,
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

function loadNumbers(locale: string): RawNumberData {
  try {
    return extractNumbers(
      (require(`cldr-numbers-full/main/${locale}/numbers.json`) as typeof NumbersData)
        .main[locale as 'ar'].numbers
    );
  } catch (e) {
    console.error('Issue processing numbers data for ' + locale);
    throw e;
  }
}

export function generateDataForLocales(
  locales: string[] = AVAILABLE_LOCALES.availableLocales.full
): Record<string, RawNumberData> {
  return locales.reduce((all: Record<string, RawNumberData>, locale) => {
    all[locale] = loadNumbers(locale);
    return all;
  }, {});
}

export function extractNumberingSystemNames() {
  // Export an object instead of array to be more compatible with rollup.
  return {
    names: Object.keys(numberingSystems.supplemental.numberingSystems),
  };
}
