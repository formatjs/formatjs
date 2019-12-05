/*
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
'use strict';
import * as Numbers from 'cldr-numbers-full/main/en/numbers.json';
import {Locale} from './types';
import generateFieldExtractorFn from './utils';
import {sync as globSync} from 'glob';
import {resolve, dirname} from 'path';
import {SANCTIONED_UNITS, UnitData, NumberLocaleData} from '@formatjs/intl-utils';

const numbersLocales = globSync('*/numbers.json', {
  cwd: resolve(
    dirname(require.resolve('cldr-numbers-full/package.json')),
    './main'
  ),
}).map(dirname);

export type NumbersData = typeof Numbers['main']['en']['numbers'];



// https://tc39.es/proposal-unified-intl-numberformat/section11/numberformat_proposed_out.html#sec-intl.numberformat-internal-slots
function extractNumberPattern(d: NumbersData): NumberLocaleData {
  return {
    nu: d.defaultNumberingSystem === 'latn' ? ['latn'] : [d.defaultNumberingSystem, 'latn'],
    patterns: {
      
    }
    
  };
}

export function getAllLocales() {
  return numbersLocales
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
