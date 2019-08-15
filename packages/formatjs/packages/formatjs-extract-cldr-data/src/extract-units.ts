/*
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
'use strict';
import {unitsLocales} from './locales';
import * as Units from 'cldr-units-full/main/en/units.json';
import {Locale} from './types';
import generateFieldExtractorFn from './utils';

export type Units = typeof Units['main']['en']['units'];

const allUnits = Object.keys(Units.main.en.units.long);

interface UnitPattern {
  one?: string;
  other?: string;
  perUnit?: string;
}

export interface UnitData {
  displayName: string;
  long: UnitPattern;
  short?: UnitPattern;
  narrow?: UnitPattern;
}

function extractUnitPattern(d: Units['long']['volume-gallon']) {
  return {
    one: d['unitPattern-count-one'],
    other: d['unitPattern-count-other'],
    perUnit: d['perUnitPattern'],
  };
}

function loadUnits(locale: Locale, field?: string): UnitData {
  const units = (require(`cldr-units-full/main/${locale}/units.json`) as typeof Units)
    .main[locale as 'en'].units;
  return {
    displayName: units.long[field as 'digital-bit'].displayName,
    long: extractUnitPattern(units.long[field as 'volume-gallon']),
    short: extractUnitPattern(units.short[field as 'volume-gallon']),
    narrow: extractUnitPattern(units.narrow[field as 'volume-gallon']),
  };
}

function hasUnits(locale: Locale): boolean {
  return unitsLocales.includes(locale);
}

const extractUnits = generateFieldExtractorFn<UnitData>(loadUnits, hasUnits);

export default function extract(
  locales: Locale[]
): Record<string, Record<string, {fields: UnitData}>> {
  return allUnits.reduce(
    (all: Record<string, Record<string, {fields: UnitData}>>, unit) => {
      all[unit] = extractUnits(locales, unit);
      return all;
    },
    {}
  );
}
