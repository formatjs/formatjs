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
import {
  SANCTIONED_UNITS,
  UnitData,
  LDMLPluralRuleMap,
  RawUnitPattern,
} from '@formatjs/intl-utils';

const unitsLocales = globSync('*/units.json', {
  cwd: resolve(
    dirname(require.resolve('cldr-units-full/package.json')),
    './main'
  ),
}).map(dirname);

export type Units = typeof Units['main']['en']['units'];

function shortenUnit(unit: string) {
  return unit.replace(/^(.*?)-/, '');
}

function partitionUnitPattern(pattern: string) {
  return (
    pattern
      // Handle `{0}foo` & `{0} foo`
      .replace(/^(\{0\}\s?)(.+)$/, `$1{1}`)
      // Handle `foo{0}` & `foo {0}`
      .replace(/^(.*?)(\s?\{0\})$/, `{1}$2`)
  );
}

// Matches things like `foo {0}`, `foo{0}`, `{0}foo`
const PATTERN_0_REGEX = /\s?\{0\}\s?/g;

function prune0Token(str: string): string {
  return str.replace(PATTERN_0_REGEX, '');
}

function extractUnitPattern(d: Units['long']['volume-gallon']) {
  return collapseSingleValuePluralRule(
    PLURAL_RULES.reduce(
      (all: LDMLPluralRuleMap<RawUnitPattern>, ldml) => {
        if (d[`unitPattern-count-${ldml}` as 'unitPattern-count-one']) {
          all[ldml] = {
            symbol: prune0Token(
              d[`unitPattern-count-${ldml}` as 'unitPattern-count-one']
            ),
            pattern: partitionUnitPattern(
              d[`unitPattern-count-${ldml}` as 'unitPattern-count-one']
            ),
          };
        }
        return all;
      },
      {
        other: {
          symbol: prune0Token(d['unitPattern-count-other']),
          pattern: partitionUnitPattern(d['unitPattern-count-other']),
        },
      }
    )
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
    all[shortenUnit(unit)] = {
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

export function generateDataForLocales(
  locales: string[] = getAllLocales()
): Record<string, Record<string, UnitData>> {
  return locales.reduce(
    (all: Record<string, Record<string, UnitData>>, locale) => {
      all[locale] = loadUnits(locale);
      return all;
    },
    {}
  );
}

export default generateFieldExtractorFn<Record<string, UnitData>>(
  loadUnits,
  hasUnits,
  getAllLocales()
);
