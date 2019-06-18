/*
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
import expandLocales, { LocaleEntry } from './expand-locales';
import extractRelativeFields, { FieldData } from './extract-relative';
import { getAllLocales } from './locales';
import { Locale } from './types';

export interface Opts {
  locales?: string[];
  relativeFields?: boolean;
}

export default function extractData(options: Opts = {}) {
  // Default to all CLDR locales if none have been provided.
  const locales = options.locales || getAllLocales();

  // Each type of data has the structure: `{"<locale>": {"<key>": <value>}}`,
  // which is well suited for merging into a single object per locale. This
  // performs that deep merge and returns the aggregated result.
  return mergeData(
    expandLocales(locales),
    options.relativeFields ? extractRelativeFields(locales) : {}
  );
}

function mergeData(
  entries: Record<Locale, LocaleEntry> = {},
  relativeFields: Record<Locale, { fields: Record<string, FieldData> }> = {}
): Record<Locale, LocaleEntry & { fields?: Record<string, FieldData> }> {
  const data: Record<
    Locale,
    LocaleEntry & { fields?: Record<string, FieldData> }
  > = {};
  Object.keys(entries).forEach(locale => {
    data[locale] = { ...entries[locale] };
  });
  Object.keys(relativeFields).forEach(locale => {
    if (!data[locale]) {
      data[locale] = { locale };
    }
    data[locale] = { ...data[locale], ...relativeFields[locale] };
  });
  return data;
}
