/*
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
'use strict';
import * as Currencies from 'cldr-numbers-full/main/en/currencies.json';
import * as supplementalCurrencyData from 'cldr-core/supplemental/currencyData.json';
import {Locale} from './types';
import generateFieldExtractorFn, {
  collapseSingleValuePluralRule,
  PLURAL_RULES,
} from './utils';
import {sync as globSync} from 'glob';
import {resolve, dirname} from 'path';
import {CurrencyData, LDMLPluralRuleMap} from '@formatjs/intl-utils';

const unitsLocales = globSync('*/currencies.json', {
  cwd: resolve(
    dirname(require.resolve('cldr-numbers-full/package.json')),
    './main'
  ),
}).map(dirname);

export type Currencies = typeof Currencies['main']['en']['numbers']['currencies'];

function extractCurrencyPattern(d: Currencies['USD']) {
  if (!d['displayName-count-other']) {
    return;
  }
  return collapseSingleValuePluralRule(
    PLURAL_RULES.reduce(
      (all: LDMLPluralRuleMap<string>, ldml) => {
        if (d[`displayName-count-${ldml}` as 'displayName-count-one']) {
          all[ldml] = d[`displayName-count-${ldml}` as 'displayName-count-one'];
        }
        return all;
      },
      {other: d['displayName-count-other']}
    )
  );
}

export function getAllLocales() {
  return globSync('*/units.json', {
    cwd: resolve(
      dirname(require.resolve('cldr-units-full/package.json')),
      './main'
    ),
  }).map(dirname);
}

function loadCurrencies(locale: Locale): Record<string, CurrencyData> {
  const currencies = (require(`cldr-numbers-full/main/${locale}/currencies.json`) as typeof Currencies)
    .main[locale as 'en'].numbers.currencies;
  return (Object.keys(currencies) as Array<keyof typeof currencies>).reduce(
    (all: Record<string, CurrencyData>, isoCode) => {
      const d = currencies[isoCode] as Currencies['USD'];
      const displayName = extractCurrencyPattern(d) || {other: d.displayName};
      all[isoCode] = {
        displayName,
        symbol: d.symbol || isoCode,
        narrow: d['symbol-alt-narrow'] || d.symbol || isoCode,
      };
      return all;
    },
    {}
  );
}

function hasCurrencies(locale: Locale): boolean {
  return unitsLocales.includes(locale);
}

export function generateDataForLocales(
  locales: string[] = getAllLocales()
): Record<string, Record<string, CurrencyData>> {
  return locales.reduce(
    (all: Record<string, Record<string, CurrencyData>>, locale) => {
      all[locale] = loadCurrencies(locale);
      return all;
    },
    {}
  );
}

export default generateFieldExtractorFn<Record<string, CurrencyData>>(
  loadCurrencies,
  hasCurrencies,
  getAllLocales()
);

export function extractCurrencyDigits(): Record<string, number> {
  const data = supplementalCurrencyData.supplemental.currencyData.fractions;
  return (Object.keys(data) as Array<keyof typeof data>).reduce(
    (all: Record<string, number>, code) => {
      all[code] = +data[code]._digits;
      return all;
    },
    {}
  );
}
