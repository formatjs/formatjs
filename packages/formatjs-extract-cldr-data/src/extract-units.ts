/*
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
import * as _ from 'lodash';
import {
  invariant,
  LDMLPluralRuleMap,
  UnitDataTable,
  removeUnitNamespace,
  isWellFormedUnitIdentifier,
  UnitData,
} from '@formatjs/intl-utils';
import * as UnitsData from 'cldr-units-full/main/en/units.json';
import {sync as globSync} from 'glob';
import {dirname, resolve} from 'path';
import {Locale} from './types';
import generateFieldExtractorFn, {
  collapseSingleValuePluralRule,
  PLURAL_RULES,
} from './utils';

const unitsLocales = globSync('*/units.json', {
  cwd: resolve(
    dirname(require.resolve('cldr-units-full/package.json')),
    './main'
  ),
}).map(dirname);

export type Units = typeof UnitsData['main']['en']['units'];

function extractUnitPattern(d: Units['long']['volume-gallon']) {
  return collapseSingleValuePluralRule(
    PLURAL_RULES.reduce((all: LDMLPluralRuleMap<string>, ldml) => {
      if (d[`unitPattern-count-${ldml}` as 'unitPattern-count-one']) {
        all[ldml] = d[`unitPattern-count-${ldml}` as 'unitPattern-count-one'];
      }
      return all;
    }, {} as any)
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

function loadUnits(locale: Locale): UnitDataTable {
  const units = (require(`cldr-units-full/main/${locale}/units.json`) as typeof UnitsData)
    .main[locale as 'en'].units;

  invariant(
    !!(
      units.long.per.compoundUnitPattern &&
      units.short.per.compoundUnitPattern &&
      units.narrow.per.compoundUnitPattern
    ),
    `Missing "per" compound pattern in locale ${locale}`
  );

  const validUnits = Object.keys(units.long).filter(unit => {
    return isWellFormedUnitIdentifier(removeUnitNamespace(unit));
  });

  const simpleUnitEntries: [string, UnitData][] = validUnits.map(unit => {
    if (!units.long[unit as 'digital-bit']) {
      throw new Error(`${unit} does not have any data`);
    }
    return [
      removeUnitNamespace(unit),
      {
        // displayName: units.long[unit as 'digital-bit'].displayName,
        long: extractUnitPattern(units.long[unit as 'volume-gallon']),
        short: extractUnitPattern(units.short[unit as 'volume-gallon']),
        narrow: extractUnitPattern(units.narrow[unit as 'volume-gallon']),
        perUnit: {
          long: units.long[unit as 'volume-gallon'].perUnitPattern,
          short: units.short[unit as 'volume-gallon'].perUnitPattern,
          narrow: units.narrow[unit as 'volume-gallon'].perUnitPattern,
        },
      },
    ];
  });

  const compoundUnits = {
    per: {
      long: units.long.per.compoundUnitPattern,
      short: units.short.per.compoundUnitPattern,
      narrow: units.narrow.per.compoundUnitPattern,
    },
  };

  return {simple: _.fromPairs(simpleUnitEntries), compound: compoundUnits};
}

function hasUnits(locale: Locale): boolean {
  return unitsLocales.includes(locale);
}

export function generateDataForLocales(
  locales: string[] = getAllLocales()
): Record<string, UnitDataTable> {
  return locales.reduce((all: Record<string, UnitDataTable>, locale) => {
    all[locale] = loadUnits(locale);
    return all;
  }, {});
}

export default generateFieldExtractorFn<UnitDataTable>(
  loadUnits,
  hasUnits,
  getAllLocales()
);
