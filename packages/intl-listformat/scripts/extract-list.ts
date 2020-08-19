/*
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
'use strict';
import * as ListPatterns from 'cldr-misc-full/main/en/listPatterns.json';
import {sync as globSync} from 'fast-glob';
import {resolve, dirname} from 'path';
import {ListPatternFieldsData, ListPattern} from '@formatjs/ecma402-abstract';

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

function loadListPatterns(locale: string): ListPatternFieldsData {
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

export function extractLists(
  locales: string[] = getAllLocales()
): Record<string, ListPatternFieldsData> {
  return locales.reduce(
    (all: Record<string, ListPatternFieldsData>, locale) => {
      all[locale] = loadListPatterns(locale);
      return all;
    },
    {}
  );
}
