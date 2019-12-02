import * as Currencies from 'cldr-numbers-full/main/en/currencies.json';
import {Locale} from './types';
import generateFieldExtractorFn from './utils';
import {sync as globSync} from 'glob';
import {resolve, dirname} from 'path';
import {CurrencyData} from '@formatjs/intl-utils';
import {mapValues} from 'lodash';

export type Currencies = typeof Currencies['main']['en']['numbers']['currencies'];

export function getAllLocales() {
  return globSync('*/currencies.json', {
    cwd: resolve(
      dirname(require.resolve('cldr-numbers-full/package.json')),
      './main'
    ),
  }).map(dirname);
}

const currenciesLocales = getAllLocales();

function loadCurrencies(locale: Locale): Record<string, CurrencyData> {
  const jsonData = require(`cldr-numbers-full/main/${locale}/currencies.json`) as typeof Currencies;
  return mapValues<
    Record<
      string,
      {
        displayName: string;
        'displayName-count-one'?: string;
        'displayName-count-other': string;
        symbol: string;
        'symbol-alt-narrow'?: string;
        'symbol-alt-variant'?: string;
      }
    >,
    CurrencyData
  >(jsonData.main[locale as 'en'].numbers.currencies, currencyData => {
    return {
      displayName: {
        one: currencyData['displayName-count-one'],
        other:
          currencyData['displayName-count-other'] || currencyData.displayName,
      },
      symbol: currencyData.symbol,
      narrowSymbol: currencyData['symbol-alt-narrow'],
      variantSymbol: currencyData['symbol-alt-variant'],
    };
  });
}

function hasCurrencies(locale: Locale): boolean {
  return currenciesLocales.includes(locale);
}

export default generateFieldExtractorFn<Record<string, CurrencyData>>(
  loadCurrencies,
  hasCurrencies,
  getAllLocales()
);
