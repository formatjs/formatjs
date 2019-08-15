/*
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
'use strict';
import {dateFieldsLocales} from './locales';
import * as DateFields from 'cldr-dates-full/main/en/dateFields.json';
import {Locale} from './types';
import generateFieldExtractorFn from './utils';

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
  'second-narrow',
];

type Fields = typeof DateFields['main']['en']['dates']['fields'];

export type RelativeTimeOpt = 'zero' | 'one' | 'two' | 'few' | 'many' | 'other';
export type RelativeTimeData = {[u in RelativeTimeOpt]?: string};
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

function loadRelativeFields(locale: Locale): Record<string, FieldData> {
  const fields = (require(`cldr-dates-full/main/${locale}/dateFields.json`) as typeof DateFields)
    .main[locale as 'en'].dates.fields;

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
      past: {},
    },
    relativePeriod: data.relativePeriod,
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

function hasDateFields(locale: Locale): boolean {
  return dateFieldsLocales.includes(locale);
}

const extractRelativeFields = generateFieldExtractorFn<
  Record<string, FieldData>
>(loadRelativeFields, hasDateFields);

export default extractRelativeFields;
