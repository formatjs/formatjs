/*
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
'use strict';
import * as ListPatterns from 'cldr-misc-full/main/en/listPatterns.json';
import {Locale} from './types';
import generateFieldExtractorFn from './utils';
import {sync as globSync} from 'glob';
import {resolve, dirname} from 'path';
import {ListPatternFieldsData, ListPattern} from '@formatjs/intl-utils';

const listPatternLocales = globSync('*/listPatterns.json', {
  cwd: resolve(
    dirname(require.resolve('cldr-misc-full/package.json')),
    './main'
  ),
}).map(dirname);

export type ListTypes = typeof ListPatterns['main']['en']['listPatterns'];

export function getAllLocales() {
  return globSync('*/listPatterns.json', {
    cwd: resolve(
      dirname(require.resolve('cldr-misc-full/package.json')),
      './main'
    ),
  }).map(dirname);
}

function serializeToPatternData(
  d: ListTypes['listPattern-type-standard']
): ListPattern {
  return {
    start: d.start,
    middle: d.middle,
    end: d.end,
    pair: d['2'],
  };
}

function loadListPatterns(locale: Locale): ListPatternFieldsData {
  const patterns = (require(`cldr-misc-full/main/${locale}/listPatterns.json`) as typeof ListPatterns)
    .main[locale as 'en'].listPatterns;
  return {
    conjunction: {
      long: serializeToPatternData(patterns['listPattern-type-standard']),
      short: serializeToPatternData(
        patterns['listPattern-type-standard-short']
      ),
      narrow: serializeToPatternData(
        patterns['listPattern-type-standard-narrow']
      ),
    },
    disjunction: {
      long: serializeToPatternData(patterns['listPattern-type-or']),
      short: serializeToPatternData(patterns['listPattern-type-or-short']),
      narrow: serializeToPatternData(patterns['listPattern-type-or-narrow']),
    },
    unit: {
      long: serializeToPatternData(patterns['listPattern-type-unit']),
      short: serializeToPatternData(patterns['listPattern-type-unit-short']),
      narrow: serializeToPatternData(patterns['listPattern-type-unit-narrow']),
    },
  };
}

function hasListPatterns(locale: Locale): boolean {
  return listPatternLocales.includes(locale);
}

export default generateFieldExtractorFn<ListPatternFieldsData>(
  loadListPatterns,
  hasListPatterns,
  getAllLocales()
);
