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
import {
  DateTimeFormatLocaleInternalData,
  TimeZoneNameData,
  Formats,
  DateTimeFormatOptions,
} from '../src/types';
import * as rawTimeData from 'cldr-core/supplemental/timeData.json';
import * as rawCalendarPreferenceData from 'cldr-core/supplemental/calendarPreferenceData.json';
import * as TimeZoneNames from 'cldr-dates-full/main/en/timeZoneNames.json';
import * as metaZones from 'cldr-core/supplemental/metaZones.json';
import {parseDateTimeSkeleton} from './skeleton';
let {timeData} = rawTimeData.supplemental;
const processedTimeData = Object.keys(timeData).reduce(
  (all: Record<string, string[]>, k) => {
    all[k.replace('_', '-')] = timeData[
      k as keyof typeof timeData
    ]._allowed.split(' ');
    return all;
  },
  {}
);

function isDateFormatOnly(opts: DateTimeFormatOptions) {
  return !Object.keys(opts).find(
    k =>
      k === 'hour' ||
      k === 'minute' ||
      k === 'second' ||
      k === 'timeZoneName' ||
      k === 'hour12'
  );
}

function isTimeFormatOnly(opts: DateTimeFormatOptions) {
  return !Object.keys(opts).find(
    k =>
      k === 'year' ||
      k === 'era' ||
      k === 'month' ||
      k === 'day' ||
      k === 'weekday' ||
      k === 'quarter'
  );
}

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
  return '';
}

const {calendarPreferenceData} = rawCalendarPreferenceData.supplemental;

/**
 * TODO: There's a bug here bc a timezone can link to multiple metazone
 * since a place can change zone during course of history which is dumb
 */
const tzToMetaZoneMap = metaZones.supplemental.metaZones.metazones.reduce(
  (all: Record<string, string>, z) => {
    all[z.mapZone._type] = z.mapZone._other;
    return all;
  },
  {}
);

function loadDatesFields(locale: string): DateTimeFormatLocaleInternalData {
  const gregorian = (require(`cldr-dates-full/main/${locale}/ca-gregorian.json`) as typeof DateFields)
    .main[locale as 'en'].dates.calendars.gregorian;
  const timeZoneNames = (require(`cldr-dates-full/main/${locale}/timeZoneNames.json`) as typeof TimeZoneNames)
    .main[locale as 'en'].dates.timeZoneNames;
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
  const hc = (
    processedTimeData[locale] ||
    processedTimeData[region] ||
    processedTimeData[`${locale}-001`] ||
    processedTimeData['001']
  ).map(resolveDateTimeSymbolTable);

  const timeZoneName = !timeZoneNames.metazone
    ? {}
    : Object.keys(tzToMetaZoneMap).reduce((all: TimeZoneNameData, tz) => {
        const metazone = tzToMetaZoneMap[tz];
        const metazoneInfo =
          timeZoneNames.metazone[
            metazone as keyof typeof timeZoneNames['metazone']
          ];
        if (metazoneInfo) {
          all[tz] = {};
          if (metazoneInfo.long) {
            all[tz].long = [
              metazoneInfo.long.standard,
              'daylight' in metazoneInfo.long
                ? metazoneInfo.long.daylight
                : metazoneInfo.long.standard,
            ];
          }
          if ('short' in metazoneInfo) {
            all[tz].short = [
              metazoneInfo.short.standard,
              'daylight' in metazoneInfo.short
                ? metazoneInfo.short.daylight
                : metazoneInfo.short.standard,
            ];
          }
        }

        return all;
      }, {});
  const {dateFormats, timeFormats} = gregorian;
  let dateFormatEntries: Formats[] = [];
  try {
    dateFormatEntries = Object.values(dateFormats).map(v =>
      typeof v === 'object'
        ? // Locale haw got some weird structure https://github.com/unicode-cldr/cldr-dates-full/blob/master/main/haw/ca-gregorian.json
          parseDateTimeSkeleton((v as {_value: string})._value)
        : parseDateTimeSkeleton(v)
    );
  } catch (e) {
    console.error(`Issue processing dateFormats for locale ${locale}`);
  }
  const timeFormatEntries = Object.values(timeFormats).map(
    parseDateTimeSkeleton
  );
  const {
    availableFormats,
    short,
    full,
    medium,
    long,
  } = gregorian.dateTimeFormats;
  const availableFormatEntries = Object.values(availableFormats).map(
    parseDateTimeSkeleton
  );
  const allFormats = [
    ...availableFormatEntries,
    ...dateFormatEntries,
    ...timeFormatEntries,
  ];

  for (const availableFormatEntry of availableFormatEntries) {
    if (isDateFormatOnly(availableFormatEntry)) {
      dateFormatEntries.push(availableFormatEntry);
    } else if (isTimeFormatOnly(availableFormatEntry)) {
      timeFormatEntries.push(availableFormatEntry);
    }
  }

  // Based on https://unicode.org/reports/tr35/tr35-dates.html#Missing_Skeleton_Fields
  for (const timeFormat of timeFormatEntries) {
    for (const dateFormat of dateFormatEntries) {
      let skeleton;
      if (dateFormat.month === 'long') {
        skeleton = dateFormat.weekday ? full : long;
      } else if (dateFormat.month === 'short') {
        skeleton = medium;
      } else {
        skeleton = short;
      }
      skeleton = skeleton
        .replace('{0}', timeFormat.skeleton)
        .replace('{1}', dateFormat.skeleton);
      allFormats.push(parseDateTimeSkeleton(skeleton));
    }
  }

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
    timeZoneName,
    gmtFormat: timeZoneNames.gmtFormat,
    hourFormat: timeZoneNames.hourFormat,
    formats: {
      gregorian: allFormats,
    },
    hourCycle: hc[0],
    nu: nu ? [nu] : [],
    ca: (
      calendarPreferenceData[region as keyof typeof calendarPreferenceData] ||
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
