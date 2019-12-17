/*
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
'use strict';
import * as Currencies from 'cldr-numbers-full/main/en/currencies.json';
import {Locale} from './types';
import generateFieldExtractorFn, {
  collapseSingleValuePluralRule,
  PLURAL_RULES,
} from './utils';
import {sync as globSync} from 'glob';
import {resolve, dirname} from 'path';
import {CurrencyData, LDMLPluralRule} from '@formatjs/intl-utils';

const unitsLocales = globSync('*/currencies.json', {
  cwd: resolve(
    dirname(require.resolve('cldr-numbers-full/package.json')),
    './main'
  ),
}).map(dirname);

export type Currencies = typeof Currencies['main']['en']['numbers']['currencies'];

function extractCurrencyPattern(d: Currencies['USD']) {
  return collapseSingleValuePluralRule(
    PLURAL_RULES.reduce((all: Record<LDMLPluralRule, string>, ldml) => {
      if (d[`displayName-count-${ldml}` as 'displayName-count-one']) {
        all[ldml] = d[`displayName-count-${ldml}` as 'displayName-count-one'];
      }
      return all;
    }, {} as Record<LDMLPluralRule, string>)
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
    (all: Record<string, CurrencyData>, symbol) => {
      const d = currencies[symbol] as Currencies['USD'];
      all[symbol] = {
        displayName: extractCurrencyPattern(d),
        symbol,
      };
      if (d['symbol-alt-narrow']) {
        all[symbol].narrow = d['symbol-alt-narrow'];
      }
      return all;
    },
    {}
  );
}

function hasCurrencies(locale: Locale): boolean {
  return unitsLocales.includes(locale);
}

export default generateFieldExtractorFn<Record<string, CurrencyData>>(
  loadCurrencies,
  hasCurrencies,
  getAllLocales()
);
