/*
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
import extractRelativeFields, {FieldData} from './extract-relative';
import extractUnits from './extract-units';
import {getAllLocales} from './locales';
import {
  getParentLocaleAndAliasHierarchy,
  getParentLocaleHierarchy,
} from './locales';
import {omitBy} from 'lodash';

export interface Opts {
  locales?: string[];
  relativeFields?: boolean;
}

import {process} from './process-aliases';

export function extractAllRelativeFields(options: Opts = {}) {
  const parentLocales = getParentLocaleHierarchy();
  const aliases = process();
  // Default to all CLDR locales if none have been provided.
  const locales = options.locales || getAllLocales();
  const localeToFields = extractRelativeFields(locales);
  return Object.keys(localeToFields).reduce(
    (all: typeof localeToFields, locale) => {
      const data = localeToFields[locale];
      const parentLocaleHierarchy = getParentLocaleAndAliasHierarchy(
        locale,
        parentLocales,
        aliases
      );
      while (parentLocaleHierarchy.length) {
        const parentLocale = parentLocaleHierarchy.shift();
        const parentData = localeToFields[parentLocale!];
        if (parentData) {
          all[locale] = omitBy(
            data,
            (d, field) =>
              JSON.stringify(parentData[field]) === JSON.stringify(d)
          );
          break;
        }
      }
      if (!all[locale]) {
        all[locale] = data;
      }
      return all;
    },
    {}
  );
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

export const processAliases = process;
