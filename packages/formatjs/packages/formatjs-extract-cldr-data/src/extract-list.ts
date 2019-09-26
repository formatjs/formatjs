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
import {ListPatternData, ListPatternLocaleData} from '@formatjs/intl-utils';

const listPattternLocales = globSync('*/listPatterns.json', {
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

function loadListPatterns(locale: Locale): ListPatternLocaleData['patterns'] {
  const patterns = (require(`cldr-misc-full/main/${locale}/listPatterns.json`) as typeof ListPatterns)
    .main[locale as 'en'].listPatterns;
  return {
    standard: {
      long: patterns['listPattern-type-standard'],
      short: patterns['listPattern-type-standard-short'],
      narrow: patterns['listPattern-type-standard-narrow'],
    },
    or: {
      long: patterns['listPattern-type-or'],
      short: patterns['listPattern-type-or-short'],
      narrow: patterns['listPattern-type-or-narrow'],
    },
    unit: {
      long: patterns['listPattern-type-unit'],
      short: patterns['listPattern-type-unit-short'],
      narrow: patterns['listPattern-type-unit-narrow'],
    },
  };
}

function hasListPatterns(locale: Locale): boolean {
  return listPattternLocales.includes(locale);
}

export default generateFieldExtractorFn<Record<string, ListPatternData>>(
  loadListPatterns,
  hasListPatterns,
  getAllLocales()
);
