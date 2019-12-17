/*
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
'use strict';
import * as Units from 'cldr-units-full/main/en/units.json';
import {Locale} from './types';
import generateFieldExtractorFn, {
  collapseSingleValuePluralRule,
  PLURAL_RULES,
} from './utils';
import {sync as globSync} from 'glob';
import {resolve, dirname} from 'path';
import {SANCTIONED_UNITS, UnitData, LDMLPluralRule} from '@formatjs/intl-utils';

const unitsLocales = globSync('*/units.json', {
  cwd: resolve(
    dirname(require.resolve('cldr-units-full/package.json')),
    './main'
  ),
}).map(dirname);

export type Units = typeof Units['main']['en']['units'];

function extractUnitPattern(d: Units['long']['volume-gallon']) {
  return collapseSingleValuePluralRule(
    PLURAL_RULES.reduce((all: Record<LDMLPluralRule, string>, ldml) => {
      if (d[`unitPattern-count-${ldml}` as 'unitPattern-count-one']) {
        all[ldml] = d[`unitPattern-count-${ldml}` as 'unitPattern-count-one'];
      }
      return all;
    }, {} as Record<LDMLPluralRule, string>)
  );
}

export function getAllLocales() {
  return globSync('*/units.json', {
    cwd: resolve(
      dirname(require.resolve('cldr-units-full/package.json')),
      './main'
    ),
  }).map(dirname);
}

function loadUnits(locale: Locale): Record<string, UnitData> {
  const units = (require(`cldr-units-full/main/${locale}/units.json`) as typeof Units)
    .main[locale as 'en'].units;
  return SANCTIONED_UNITS.reduce((all: Record<string, UnitData>, unit) => {
    if (!units.long[unit as 'digital-bit']) {
      throw new Error(`${unit} does not have any data`);
    }
    all[unit] = {
      displayName: units.long[unit as 'digital-bit'].displayName,
      long: extractUnitPattern(units.long[unit as 'volume-gallon']),
      short: extractUnitPattern(units.short[unit as 'volume-gallon']),
      narrow: extractUnitPattern(units.narrow[unit as 'volume-gallon']),
    };
    return all;
  }, {});
}

function hasUnits(locale: Locale): boolean {
  return unitsLocales.includes(locale);
}

export default generateFieldExtractorFn<Record<string, UnitData>>(
  loadUnits,
  hasUnits,
  getAllLocales()
);
