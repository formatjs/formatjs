/*
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
import extractRelativeFields, {
  getAllLocales as getAllDateFieldsLocales,
} from './extract-relative';
import extractUnits, {
  getAllLocales as getAllUnitsLocales,
} from './extract-units';
import extractListPatterns, {
  getAllLocales as getAllListLocales,
} from './extract-list';
import extractCurrencies, {
  getAllLocales as getAllCurrenciesLocales,
} from './extract-currencies';
import extractNumbers, {
  getAllLocales as getAllNumbersLocales,
} from './extract-numbers';
export interface Opts {
  locales?: string[];
}

export function extractAllRelativeFields(options: Opts = {}) {
  // Default to all CLDR locales if none have been provided.
  const locales = options.locales || getAllDateFieldsLocales();
  return extractRelativeFields(locales);
}

export function extractAllUnits(options: Opts = {}) {
  // Default to all CLDR locales if none have been provided.
  const locales = options.locales || getAllUnitsLocales();
  return extractUnits(locales);
}

export function extractAllListPatterns(options: Opts = {}) {
  // Default to all CLDR locales if none have been provided.
  const locales = options.locales || getAllListLocales();
  return extractListPatterns(locales);
}

export function extractAllCurrencies(options: Opts = {}) {
  // Default to all CLDR locales if none have been provided.
  const locales = options.locales || getAllCurrenciesLocales();
  return extractCurrencies(locales);
}

export function extractAllNumbers(options: Opts = {}) {
  // Default to all CLDR locales if none have been provided.
  const locales = options.locales || getAllNumbersLocales();
  return extractNumbers(locales);
}

export {getAllLanguages} from './locales';

export const processAliases = process;
export {getAllLocales as getAllDateFieldsLocales} from './extract-relative';
export {getAllLocales as getAllListLocales} from './extract-list';
export {getAllLocales as getAllUnitsLocales} from './extract-units';
export {getAllLocales as getAllCurrenciesLocales} from './extract-currencies';
export {getAllLocales as getAllNumbersLocales} from './extract-numbers';
