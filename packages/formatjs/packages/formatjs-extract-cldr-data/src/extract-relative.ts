/*
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
'use strict';

import * as DateFields from 'cldr-dates-full/main/en/dateFields.json';
import * as NumberFields from 'cldr-numbers-full/main/en/numbers.json';
import {Locale} from './types';
import generateFieldExtractorFn from './utils';
import {sync as globSync} from 'glob';
import {resolve, dirname} from 'path';
import {FieldData, LocaleFieldsData} from '@formatjs/intl-utils';

const dateFieldsLocales = globSync('*/dateFields.json', {
  cwd: resolve(
    dirname(require.resolve('cldr-dates-full/package.json')),
    './main'
  ),
}).map(dirname);

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

export function getAllLocales() {
  return globSync('*/dateFields.json', {
    cwd: resolve(
      dirname(require.resolve('cldr-dates-full/package.json')),
      './main'
    ),
  }).map(dirname);
}

function loadRelativeFields(locale: Locale): LocaleFieldsData {
  const fields = (require(`cldr-dates-full/main/${locale}/dateFields.json`) as typeof DateFields)
    .main[locale as 'en'].dates.fields;
  let nu: string | null = null;
  try {
    nu = (require(`cldr-numbers-full/main/${locale}/numbers.json`) as typeof NumberFields)
      .main[locale as 'en'].numbers.defaultNumberingSystem;
  } catch (e) {
    // Ignore
  }

  // Reduce the date fields data down to whitelist of fields needed in the
  // FormatJS libs.
  return FIELD_NAMES.reduce(
    (relative: LocaleFieldsData, field) => {
      // Transform the fields data from the CLDR structure to one that's
      // easier to override and customize (if needed). This is also required
      // back-compat in v1.x of the FormatJS libs.
      relative[field as 'year'] = transformFieldData(fields[field as 'week']);
      return relative;
    },
    {
      nu: [nu],
    }
  );
}

// Transforms the CLDR's data structure for the relative fields into a structure
// that's more concise and easier to override to supply custom data.
function transformFieldData(data: Fields['week']): FieldData {
  const processed: FieldData = {
    future: {},
    past: {},
  };
  Object.keys(data).forEach(function(key) {
    const type = key.match(/^(relative|relativeTime)-type-(.+)$/) || [];

    switch (type[1]) {
      case 'relative':
        processed[type[2] as '0'] = data[key as 'relative-type-0'];
        break;

      case 'relativeTime':
        processed[type[2] as 'past'] = Object.keys(
          data[key as 'relativeTime-type-past']
        ).reduce((counts: FieldData['past'], count) => {
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

const extractRelativeFields = generateFieldExtractorFn<LocaleFieldsData>(
  loadRelativeFields,
  hasDateFields,
  getAllLocales()
);

export default extractRelativeFields;
