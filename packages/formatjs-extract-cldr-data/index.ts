/*
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
import extractRelativeFields from './src/extract-relative';
import extractListPatterns from './src/extract-list';
import extractNumbers from './src/extract-numbers';
import extractUnits from './src/extract-units';
import extractCurrencies from './src/extract-currencies';
import extractDisplayNames from './src/extract-displaynames';
import {getAllLocales} from './src/locales';
export const locales = getAllLocales();
export interface Opts {
  locales?: string[];
}

export function extractAllRelativeFields(options: Opts = {}) {
  return extractRelativeFields(options.locales || locales);
}

export function extractAllListPatterns(options: Opts = {}) {
  return extractListPatterns(options.locales || locales);
}

export function extractAllNumbers(options: Opts = {}) {
  return extractNumbers(options.locales || locales);
}

export function extractAllUnits(options: Opts = {}) {
  return extractUnits(options.locales || locales);
}

export function extractAllCurrencies(options: Opts = {}) {
  return extractCurrencies(options.locales || locales);
}

export function extractAllDisplayNames(options: Opts = {}) {
  return extractDisplayNames(options.locales || locales);
}

export {getAllLanguages} from './src/locales';

export const processAliases = process;
export {getAllLocales as getAllDateFieldsLocales} from './src/extract-relative';
export {getAllLocales as getAllListLocales} from './src/extract-list';
export {
  extractCurrencyDigits,
  generateDataForLocales as generateCurrencyDataForLocales,
} from './src/extract-currencies';
export {generateDataForLocales as generateUnitDataForLocales} from './src/extract-units';
export {
  extractNumberingSystemNames,
  generateDataForLocales as generateNumberDataForLocales,
} from './src/extract-numbers';
export {getAllLocales as getAllDisplayNamesLocales} from './src/extract-displaynames';
