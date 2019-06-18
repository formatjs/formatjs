/*
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
'use strict';
import { getParentLocale, hasDateFields, normalizeLocale } from './locales';
import { dateFields } from './dateFields';
import { Locale } from './types';

// The set of CLDR date field names that are used in FormatJS.
const FIELD_NAMES = [
  'year',
  'year-short',
  'year-narrow',
  'quarter',
  'quarter-short',
  'quarter-narrow',
  'month',
  'month-short',
  'month-narrow',
  'week',
  'week-short',
  'week-narrow',
  'day',
  'day-short',
  'day-narrow',
  'hour',
  'hour-short',
  'hour-narrow',
  'minute',
  'minute-short',
  'minute-narrow',
  'second',
  'second-short',
  'second-narrow'
];

type Fields = typeof dateFields['en']['main']['en']['dates']['fields'];

export type RelativeTimeOpt = 'zero' | 'one' | 'two' | 'few' | 'many' | 'other';
export type RelativeTimeData = { [u in RelativeTimeOpt]?: string };
export interface FieldData {
  displayName: string;
  relative: {
    '0'?: string;
    '1'?: string;
    '-1'?: string;
    '2'?: string;
    '-2'?: string;
    '3'?: string;
    '-3'?: string;
  };
  relativePeriod?: string;
  relativeTime: {
    future: RelativeTimeData;
    past: RelativeTimeData;
  };
}

export default function extractRelativeFields(
  locales: Locale[]
): Record<Locale, { fields: Record<string, FieldData> }> {
  // The CLDR states that the "root" locale's data should be used to fill in
  // any missing data as its data is the default.
  const defaultFields = loadRelativeFields('root');

  const fields: Record<Locale, Record<string, FieldData>> = {};
  const hashes: Record<Locale, string> = {};

  // Loads and caches the relative fields for a given `locale` because loading
  // and transforming the data is expensive.
  function getRelativeFields(locale: Locale) {
    var relativeFields = fields[locale];
    if (relativeFields) {
      return relativeFields;
    }

    if (hasDateFields(locale)) {
      relativeFields = fields[locale] = loadRelativeFields(locale);
      return relativeFields;
    }
  }

  // Hashes and caches the `fields` for a given `locale` to avoid hashing more
  // than once since it could be expensive.
  function hashFields(locale: Locale, fields: any): string {
    let hash = hashes[locale];
    if (hash) {
      return hash;
    }

    hash = hashes[locale] = JSON.stringify(fields);
    return hash;
  }

  // We want to de-dup data that can be referenced from upstream in the
  // `locale`'s hierarchy when that locale's relative fields are the _exact_
  // same as one of its ancestors. This will traverse the hierarchy for the
  // given `locale` until it finds an ancestor with same same relative fields.
  // When an ancestor can't be found, a data entry must be created for the
  // `locale` since its relative fields are unique.
  function findGreatestAncestor(locale: Locale): Locale {
    // The "root" locale is not a suitable ancestor, because there won't be
    // an entry for "root" in the final data object.
    var parentLocale = getParentLocale(locale);
    if (!parentLocale || parentLocale === 'root') {
      return locale;
    }

    // When the `locale` doesn't have fields data, we need to traverse up
    // its hierarchy to find suitable relative fields data.
    if (!hasDateFields(locale)) {
      return findGreatestAncestor(parentLocale);
    }

    var fields;
    var parentFields;
    if (hasDateFields(parentLocale)) {
      fields = getRelativeFields(locale);
      parentFields = getRelativeFields(parentLocale);

      // We can only use this ancestor's fields if they hash to the
      // _exact_ same value as `locale`'s fields. If the ancestor is
      // suitable, we keep looking up its hierarchy until the relative
      // fields are determined to be unique.
      if (
        hashFields(locale, fields) === hashFields(parentLocale, parentFields)
      ) {
        return findGreatestAncestor(parentLocale);
      }
    }

    return locale;
  }

  return locales.reduce(
    (
      relativeFields: Record<Locale, { fields: Record<string, FieldData> }>,
      locale
    ) => {
      // Walk the `locale`'s hierarchy to look for suitable ancestor with the
      // _exact_ same relative fields. If no ancestor is found, the given
      // `locale` will be returned.
      locale = findGreatestAncestor(normalizeLocale(locale));

      // The "root" locale is ignored because the built-in `Intl` libraries in
      // JavaScript have no notion of a "root" locale; instead they use the
      // IANA Language Subtag Registry.
      if (locale === 'root') {
        return relativeFields;
      }

      // Add an entry for the `locale`, which might be an ancestor. If the
      // locale doesn't have relative fields, then we fallback to the "root"
      // locale's fields.
      relativeFields[locale] = {
        fields: getRelativeFields(locale) || defaultFields
      };

      return relativeFields;
    },
    {}
  );
}

function loadRelativeFields(locale: Locale): Record<Locale, FieldData> {
  var fields = dateFields[locale as 'en'].main[locale as 'en'].dates.fields;

  // Reduce the date fields data down to whitelist of fields needed in the
  // FormatJS libs.
  return FIELD_NAMES.reduce((relative: Record<string, FieldData>, field) => {
    // Transform the fields data from the CLDR structure to one that's
    // easier to override and customize (if needed). This is also required
    // back-compat in v1.x of the FormatJS libs.
    relative[field] = transformFieldData(fields[field as 'week']);
    return relative;
  }, {});
}

// Transforms the CLDR's data structure for the relative fields into a structure
// that's more concise and easier to override to supply custom data.
function transformFieldData(data: Fields['week']): FieldData {
  const processed: FieldData = {
    displayName: data.displayName,
    relative: {},
    relativeTime: {
      future: {},
      past: {}
    },
    relativePeriod: data.relativePeriod
  };
  Object.keys(data).forEach(function(key) {
    var type = key.match(/^(relative|relativeTime)-type-(.+)$/) || [];

    switch (type[1]) {
      case 'relative':
        processed.relative[type[2] as '0'] = data[key as 'relative-type-0'];
        break;

      case 'relativeTime':
        processed.relativeTime[type[2] as 'past'] = Object.keys(
          data[key as 'relativeTime-type-past']
        ).reduce((counts: FieldData['relativeTime']['past'], count) => {
          const k = count.replace('relativeTimePattern-count-', '');
          counts[k as 'other'] =
            data[key as 'relativeTime-type-past'][
              count as 'relativeTimePattern-count-other'
            ];
          return counts;
        }, {});

        break;
    }
  });

  return processed;
}
