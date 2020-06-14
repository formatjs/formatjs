/*
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
'use strict';

import * as DateFields from 'cldr-dates-full/main/en/ca-gregorian.json';
import * as NumberFields from 'cldr-numbers-full/main/en/numbers.json';
import {sync as globSync} from 'glob';
import {resolve, dirname} from 'path';
import * as AVAILABLE_LOCALES from 'cldr-core/availableLocales.json';
import {DateTimeFormatLocaleInternalData} from '../src/types';
import * as rawTimeData from 'cldr-core/supplemental/timeData.json';
import * as rawCalendarPreferenceData from 'cldr-core/supplemental/calendarPreferenceData.json';
import * as TimeZoneNames from 'cldr-dates-full/main/en/timeZoneNames.json';
import * as metaZones from 'cldr-core/supplemental/metaZones.json';
let {timeData} = rawTimeData.supplemental;
const processedTimeData = Object.keys(timeData).reduce(
  (all: Record<string, string[]>, k) => {
    all[k.replace('_', '-')] = timeData[k]._allowed.split(' ');
    return all;
  },
  {}
);

export function getAllLocales() {
  return globSync('*/ca-gregorian.json', {
    cwd: resolve(
      dirname(require.resolve('cldr-dates-full/package.json')),
      './main'
    ),
  }).map(dirname);
}

function resolveDateTimeSymbolTable(token: string): string {
  switch (token) {
    case 'h':
      return 'h12';
    case 'H':
      return 'h23';
    case 'K':
      return 'h11';
    case 'k':
      return 'h24';
  }
}

function loadDatesFields(locale: string): DateTimeFormatLocaleInternalData {
  const gregorian = (require(`cldr-dates-full/main/${locale}/ca-gregorian.json`) as typeof DateFields)
    .main[locale as 'en'].dates.calendars.gregorian;
  const timeZoneNames = (require(`cldr-dates-full/main/${locale}/timeZoneNames.json`) as typeof TimeZoneNames)
    .main[locale as 'en'].dates.timeZoneNames.zone.America.lon;
  let nu: string | null = null;
  try {
    nu = (require(`cldr-numbers-full/main/${locale}/numbers.json`) as typeof NumberFields)
      .main[locale as 'en'].numbers.defaultNumberingSystem;
  } catch (e) {
    // Ignore
  }

  const region = locale.split('-')[1];

  // Reduce the date fields data down to whitelist of fields needed in the
  // FormatJS libs.
  const hc = (processedTimeData[locale] || processedTimeData[region] || []).map(
    resolveDateTimeSymbolTable
  );
  return {
    am: gregorian.dayPeriods.format.abbreviated.am,
    pm: gregorian.dayPeriods.format.abbreviated.pm,
    weekday: {
      narrow: Object.values(gregorian.days.format.narrow),
      short: Object.values(gregorian.days.format.short),
      long: Object.values(gregorian.days.format.wide),
    },
    era: {
      narrow: Object.values(gregorian.days.format.narrow),
      short: Object.values(gregorian.days.format.short),
      long: Object.values(gregorian.days.format.wide),
    },
    month: {
      narrow: Object.values(gregorian.months.format.narrow),
      short: Object.values(gregorian.months.format.abbreviated),
      long: Object.values(gregorian.months.format.wide),
    },
    // TODO
    timeZoneName: {
      short: ['', ''],
      long: ['', ''],
    },
    formats: {
      gregorian: [],
    },
    hourCycle: hc[0],
    nu: [nu],
    ca: (
      rawCalendarPreferenceData.supplemental.calendarPreferenceData[region] ||
      'gregorian'
    ).split(' '),
    hc,
  };
}

export function extractDatesFields(
  locales: string[] = AVAILABLE_LOCALES.availableLocales.full
): Record<string, DateTimeFormatLocaleInternalData> {
  return locales.reduce(
    (all: Record<string, DateTimeFormatLocaleInternalData>, locale) => {
      all[locale] = loadDatesFields(locale);
      return all;
    },
    {}
  );
}
