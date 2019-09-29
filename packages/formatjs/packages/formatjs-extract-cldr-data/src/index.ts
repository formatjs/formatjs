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
import extracListPatterns, {
  getAllLocales as getAllListLocales,
} from './extract-list';

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
  return extracListPatterns(locales);
}

export {getAllLanguages} from './locales';

export const processAliases = process;
export {getAllLocales as getAllDateFieldsLocales} from './extract-relative';
export {getAllLocales as getAllListLocales} from './extract-list';
export {getAllLocales as getAllUnitsLocales} from './extract-units';
