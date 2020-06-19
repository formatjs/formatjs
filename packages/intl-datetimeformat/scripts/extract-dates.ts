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
  RawDateTimeLocaleInternalData,
  TimeZoneNameData,
  DateTimeFormatOptions,
} from '../src/types';
import * as rawTimeData from 'cldr-core/supplemental/timeData.json';
import * as rawCalendarPreferenceData from 'cldr-core/supplemental/calendarPreferenceData.json';
import * as TimeZoneNames from 'cldr-dates-full/main/en/timeZoneNames.json';
import * as metaZones from 'cldr-core/supplemental/metaZones.json';
import {parseDateTimeSkeleton} from '../src/skeleton';
import IntlLocale from '@formatjs/intl-locale';
const {timeData} = rawTimeData.supplemental;
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

function loadDatesFields(locale: string): RawDateTimeLocaleInternalData {
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

  const region = new IntlLocale(locale).maximize().region;

  // Reduce the date fields data down to whitelist of fields needed in the
  // FormatJS libs.
  const hc = (
    processedTimeData[locale] ||
    processedTimeData[region!] ||
    processedTimeData[`${locale}-001`] ||
    processedTimeData['001']
  ).map(resolveDateTimeSymbolTable);

  let timeZoneName: RawDateTimeLocaleInternalData['timeZoneName'] = {};
  try {
    timeZoneName = !timeZoneNames.metazone
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
    const {long: utcLong, short: utcShort} = timeZoneNames.zone.Etc.UTC;
    timeZoneName.UTC = {};
    if (utcLong) {
      timeZoneName.UTC.long = [utcLong.standard, utcLong.standard];
    }
    if (utcShort) {
      timeZoneName.UTC.short = [utcShort.standard, utcShort.standard];
    }
  } catch (e) {
    console.error(`Issue extracting timeZoneName for ${locale}`);
    throw e;
  }

  const {short, full, medium, long} = gregorian.dateTimeFormats;

  const availableFormats = Object.values(
    gregorian.dateTimeFormats.availableFormats
  );
  const dateFormats = Object.values(gregorian.dateFormats).map(v =>
    // Locale haw got some weird structure https://github.com/unicode-cldr/cldr-dates-full/blob/master/main/haw/ca-gregorian.json
    typeof v === 'object' ? (v as {_value: string})._value : v
  );
  const timeFormats = Object.values(gregorian.timeFormats);
  const allFormats = [...availableFormats, ...dateFormats, ...timeFormats];
  for (const f of availableFormats) {
    const availableFormatEntry = parseDateTimeSkeleton(f);
    if (isDateFormatOnly(availableFormatEntry)) {
      dateFormats.push(f);
    } else if (isTimeFormatOnly(availableFormatEntry)) {
      timeFormats.push(f);
    }
  }
  // Based on https://unicode.org/reports/tr35/tr35-dates.html#Missing_Skeleton_Fields
  for (const timeFormat of timeFormats) {
    for (const dateFormat of dateFormats) {
      let skeleton;
      const entry = parseDateTimeSkeleton(dateFormat);
      if (entry.month === 'long') {
        skeleton = entry.weekday ? full : long;
      } else if (entry.month === 'short') {
        skeleton = medium;
      } else {
        skeleton = short;
      }
      skeleton = skeleton.replace('{0}', timeFormat).replace('{1}', dateFormat);
      allFormats.push(skeleton);
    }
  }
  return {
    am: gregorian.dayPeriods.format.abbreviated.am,
    pm: gregorian.dayPeriods.format.abbreviated.pm,
    weekday: {
      narrow: Object.values(gregorian.days.format.narrow),
      short: Object.values(gregorian.days.format.abbreviated),
      long: Object.values(gregorian.days.format.wide),
    },
    era: {
      narrow: {
        BC: gregorian.eras.eraNarrow[0],
        AD: gregorian.eras.eraNarrow[1],
      },
      short: {
        BC: gregorian.eras.eraAbbr[0],
        AD: gregorian.eras.eraAbbr[1],
      },
      long: {
        BC: gregorian.eras.eraNames[0],
        AD: gregorian.eras.eraNames[1],
      },
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
      gregory: allFormats,
    },
    hourCycle: hc[0],
    nu: nu ? [nu] : [],
    ca: (
      calendarPreferenceData[region as keyof typeof calendarPreferenceData] ||
      calendarPreferenceData['001']
    )
      .split(' ')
      .map(c => {
        //Resolve aliases per https://github.com/unicode-org/cldr/blob/master/common/bcp47/calendar.xml
        if (c === 'gregorian') {
          return 'gregory';
        }
        if (c === 'islamic-civil') {
          return 'islamicc';
        }
        if (c === 'ethiopic-amete-alem') {
          return 'ethioaa';
        }
        return c;
      }),
    hc,
  };
}

export function extractDatesFields(
  locales: string[] = AVAILABLE_LOCALES.availableLocales.full
): Record<string, RawDateTimeLocaleInternalData> {
  return locales.reduce(
    (all: Record<string, RawDateTimeLocaleInternalData>, locale) => {
      all[locale] = loadDatesFields(locale);
      return all;
    },
    {}
  );
}
