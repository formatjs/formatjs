/*
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
import expandLocales, {LocaleEntry} from './expand-locales';
import extractRelativeFields, {FieldData} from './extract-relative';
import extractUnits, {Units, UnitData} from './extract-units';
import {getAllLocales} from './locales';
import {Locale} from './types';

export interface Opts {
  locales?: string[];
  relativeFields?: boolean;
}

export {process as processAliases} from './process-aliases';

export function extractAllRelativeFields(options: Opts = {}) {
  // Default to all CLDR locales if none have been provided.
  const locales = options.locales || getAllLocales();

  // Each type of data has the structure: `{"<locale>": {"<key>": <value>}}`,
  // which is well suited for merging into a single object per locale. This
  // performs that deep merge and returns the aggregated result.
  return mergeData<Record<string, FieldData>>(
    expandLocales(locales),
    extractRelativeFields(locales)
  );
}

export function extractAllUnits(options: Opts = {}) {
  // Default to all CLDR locales if none have been provided.
  const locales = options.locales || getAllLocales();
  const allUnitsData = extractUnits(locales);
  return Object.keys(allUnitsData).reduce(
    (
      all: Record<string, Record<Locale, LocaleEntry & {fields?: UnitData}>>,
      unit
    ) => {
      all[unit] = mergeData<UnitData>(
        expandLocales(locales),
        allUnitsData[unit]
      );
      return all;
    },
    {}
  );
}

function mergeData<D extends Record<string, any>>(
  entries: Record<Locale, LocaleEntry> = {},
  fields: Record<Locale, {fields: D}> = {}
): Record<Locale, LocaleEntry & {fields?: D}> {
  const data: Record<Locale, LocaleEntry & {fields?: D}> = {};
  Object.keys(entries).forEach(locale => {
    data[locale] = {...entries[locale]};
  });
  Object.keys(fields).forEach(locale => {
    if (!data[locale]) {
      data[locale] = {locale};
    }
    data[locale] = {...data[locale], ...fields[locale]};
  });
  return data;
}
