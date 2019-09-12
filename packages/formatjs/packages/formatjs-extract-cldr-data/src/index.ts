/*
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
import extractRelativeFields from './extract-relative';
import extractUnits from './extract-units';
import {getAllLocales} from './locales';

export interface Opts {
  locales?: string[];
  relativeFields?: boolean;
}

export {process as processAliases} from './process-aliases';

export function extractAllRelativeFields(options: Opts = {}) {
  // Default to all CLDR locales if none have been provided.
  const locales = options.locales || getAllLocales();
  return extractRelativeFields(locales);
}

export function extractAllUnits(options: Opts = {}) {
  // Default to all CLDR locales if none have been provided.
  const locales = options.locales || getAllLocales();
  return extractUnits(locales);
}

export {
  getAllLanguages,
  getAllLocales,
  getParentLocaleHierarchy,
} from './locales';
