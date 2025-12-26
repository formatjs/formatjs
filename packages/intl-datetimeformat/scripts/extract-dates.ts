/*
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
'use strict'

import * as DateFields from 'cldr-dates-full/main/en/ca-gregorian.json' with {type: 'json'}
import * as NumberFields from 'cldr-numbers-full/main/en/numbers.json' with {type: 'json'}
import {sync as globSync} from 'fast-glob'
import {resolve, dirname} from 'path'
import * as AVAILABLE_LOCALES from 'cldr-core/availableLocales.json' with {type: 'json'}
import {RawDateTimeLocaleInternalData, TimeZoneNameData} from '../src/types'
import * as rawTimeData from 'cldr-core/supplemental/timeData.json' with {type: 'json'}
import * as rawCalendarPreferenceData from 'cldr-core/supplemental/calendarPreferenceData.json' with {type: 'json'}
import * as TimeZoneNames from 'cldr-dates-full/main/en/timeZoneNames.json' with {type: 'json'}
import * as metaZones from 'cldr-core/supplemental/metaZones.json' with {type: 'json'}
import IntlLocale from '@formatjs/intl-locale'
import {Formats} from '@formatjs/ecma402-abstract'
import {parseDateTimeSkeleton} from '../src/abstract/skeleton'
import {isEqual} from 'lodash-es'
const {timeData} = rawTimeData.supplemental
const processedTimeData = Object.keys(timeData).reduce(
  (all: Record<string, string[]>, k) => {
    all[k.replace('_', '-')] =
      timeData[k as keyof typeof timeData]._allowed.split(' ')
    return all
  },
  {}
)

function isDateFormatOnly(opts: Intl.DateTimeFormatOptions) {
  return !Object.keys(opts).find(
    k =>
      k === 'hour' ||
      k === 'minute' ||
      k === 'second' ||
      k === 'timeZoneName' ||
      k === 'hour12'
  )
}

function isTimeFormatOnly(opts: Intl.DateTimeFormatOptions) {
  return !Object.keys(opts).find(
    k =>
      k === 'year' ||
      k === 'era' ||
      k === 'month' ||
      k === 'day' ||
      k === 'weekday' ||
      k === 'quarter'
  )
}

export function getAllLocales(): string[] {
  return globSync('*/ca-gregorian.json', {
    cwd: resolve(
      dirname(require.resolve('cldr-dates-full/package.json')),
      './main'
    ),
  })
    .map(dirname)
    .filter(l => {
      try {
        return (Intl as any).getCanonicalLocales(l).length
      } catch {
        console.warn(`Invalid locale ${l}`)
        return false
      }
    })
}

function resolveDateTimeSymbolTable(token: string): string {
  switch (token) {
    case 'h':
      return 'h12'
    case 'H':
      return 'h23'
    case 'K':
      return 'h11'
    case 'k':
      return 'h24'
  }
  return ''
}

function filterKeys<T>(
  data: Record<string, T>,
  filterFn: Parameters<Array<keyof typeof data>['filter']>[0]
): Record<string, T> {
  return (Object.keys(data) as Array<keyof typeof data>)
    .filter(filterFn)
    .reduce((all: Record<string, T>, k) => {
      all[k] = data[k]
      return all
    }, {})
}

function hasAltVariant(k: string): boolean {
  return !k.endsWith('alt-variant')
}

const {calendarPreferenceData} = rawCalendarPreferenceData.supplemental

/**
 * TODO: There's a bug here bc a timezone can link to multiple metazone
 * since a place can change zone during course of history which is dumb
 */
const tzToMetaZoneMap = metaZones.supplemental.metaZones.metazones.reduce(
  (all: Record<string, string>, z) => {
    all[z.mapZone._type] = z.mapZone._other
    return all
  },
  {}
)

async function loadDatesFields(
  locale: string
): Promise<RawDateTimeLocaleInternalData> {
  const [caGregorian, tzn, numbers] = await Promise.all([
    import(`cldr-dates-full/main/${locale}/ca-gregorian.json`),
    import(`cldr-dates-full/main/${locale}/timeZoneNames.json`),
    import(`cldr-numbers-full/main/${locale}/numbers.json`).catch(
      _ => undefined
    ),
  ])
  const gregorian = (caGregorian as typeof DateFields).main[locale as 'en']
    .dates.calendars.gregorian
  const timeZoneNames = (tzn as typeof TimeZoneNames).main[locale as 'en'].dates
    .timeZoneNames
  const nu = (numbers as typeof NumberFields | undefined)?.main[locale as 'en']
    .numbers.defaultNumberingSystem

  let hc: string[] = []
  let region: string | undefined
  try {
    if (locale !== 'root') {
      region = new IntlLocale(locale).maximize().region
    }
    // Reduce the date fields data down to allowlist of fields needed in the
    // FormatJS libs.
    hc = (
      processedTimeData[locale] ||
      processedTimeData[region || ''] ||
      processedTimeData[`${locale}-001`] ||
      processedTimeData['001']
    ).map(resolveDateTimeSymbolTable)
  } catch (e) {
    console.error(`Issue extracting hourCycle for ${locale}`)
    throw e
  }
  let timeZoneName: RawDateTimeLocaleInternalData['timeZoneName'] = {}
  try {
    timeZoneName = !timeZoneNames.metazone
      ? {}
      : Object.keys(tzToMetaZoneMap).reduce((all: TimeZoneNameData, tz) => {
          const metazone = tzToMetaZoneMap[tz]
          const metazoneInfo =
            timeZoneNames.metazone[
              metazone as keyof (typeof timeZoneNames)['metazone']
            ]
          if (metazoneInfo) {
            all[tz] = {}
            if (metazoneInfo.long) {
              all[tz].long = [
                metazoneInfo.long.standard,
                'daylight' in metazoneInfo.long
                  ? metazoneInfo.long.daylight
                  : metazoneInfo.long.standard,
              ]
            }
            if ('short' in metazoneInfo) {
              all[tz].short = [
                metazoneInfo.short.standard,
                'daylight' in metazoneInfo.short
                  ? metazoneInfo.short.daylight
                  : metazoneInfo.short.standard,
              ]
            }
          }

          return all
        }, {})
    const {long: utcLong, short: utcShort} = timeZoneNames.zone.Etc.UTC
    timeZoneName.UTC = {}
    if (utcLong) {
      timeZoneName.UTC.long = [utcLong.standard, utcLong.standard]
    }
    if (utcShort) {
      timeZoneName.UTC.short = [utcShort.standard, utcShort.standard]
    }
  } catch (e) {
    console.error(`Issue extracting timeZoneName for ${locale}`)
    throw e
  }

  const {short, full, medium, long} = gregorian.dateTimeFormats

  const {availableFormats} = gregorian.dateTimeFormats
  let rawIntervalFormats = gregorian.dateTimeFormats.intervalFormats
  const intervalFormats = Object.keys(rawIntervalFormats)
    .filter(hasAltVariant)
    .reduce((all: Record<string, string | Record<string, string>>, k) => {
      const v = rawIntervalFormats[k as 'Bhm']
      all[k] = typeof v === 'string' ? v : filterKeys(v, hasAltVariant)
      return all
    }, {})
  const parsedAvailableFormats: Array<[string, string, Formats]> = Object.keys(
    availableFormats
  )
    .filter(hasAltVariant)
    .map(skeleton => {
      const pattern = availableFormats[skeleton as 'Bh']
      const skeletonIntervalFormats = intervalFormats[skeleton]
      const rangePatterns =
        typeof skeletonIntervalFormats === 'object'
          ? skeletonIntervalFormats
          : undefined
      const intervalFormatFallback =
        typeof intervalFormats.intervalFormatFallback === 'string'
          ? intervalFormats.intervalFormatFallback
          : undefined
      try {
        return [
          skeleton,
          pattern,
          parseDateTimeSkeleton(
            skeleton,
            pattern,
            rangePatterns,
            intervalFormatFallback
          ),
        ] as [string, string, Formats]
      } catch {
        // ignore
      }
    })
    .filter((f): f is [string, string, Formats] => !!f)
  const dateFormats = Object.values(gregorian.dateFormats).reduce(
    (all: Record<string, string>, v) => {
      // Locale haw got some weird structure https://github.com/unicode-cldr/cldr-dates-full/blob/master/main/haw/ca-gregorian.json
      all[v] = typeof v === 'object' ? (v as {_value: string})._value : v
      return all
    },
    {}
  )
  const timeFormats = Object.values(gregorian.timeFormats).reduce(
    (all: Record<string, string>, v) => {
      // Locale haw got some weird structure https://github.com/unicode-cldr/cldr-dates-full/blob/master/main/haw/ca-gregorian.json
      all[v] = v
      return all
    },
    {}
  )
  const allFormats: Record<string, string> = {
    ...parsedAvailableFormats.reduce(
      (all: Record<string, string>, [skeleton, pattern]) => {
        all[skeleton] = pattern
        return all
      },
      {}
    ),
    ...dateFormats,
    ...timeFormats,
  }
  for (const [
    skeleton,
    pattern,
    availableFormatEntry,
  ] of parsedAvailableFormats) {
    if (isDateFormatOnly(availableFormatEntry)) {
      dateFormats[skeleton] = pattern
    } else if (isTimeFormatOnly(availableFormatEntry)) {
      timeFormats[skeleton] = pattern
    }
  }
  // Based on https://unicode.org/reports/tr35/tr35-dates.html#Missing_Skeleton_Fields
  for (const [timeSkeleton, timePattern] of Object.entries(timeFormats)) {
    for (const [dateSkeleton, datePattern] of Object.entries(dateFormats)) {
      let rawPattern
      const entry = parseDateTimeSkeleton(dateSkeleton, datePattern)
      if (entry.month === 'long') {
        rawPattern = entry.weekday ? full : long
      } else if (entry.month === 'short') {
        rawPattern = medium
      } else {
        rawPattern = short
      }
      const pattern = rawPattern
        .replace('{0}', timePattern)
        .replace('{1}', datePattern)
      const skeleton = rawPattern
        .replace('{0}', timeSkeleton)
        .replace('{1}', dateSkeleton)
      allFormats[skeleton] = pattern

      // Synthesize interval formats for combined date+time skeletons per TR35 spec
      // See: https://unicode.org/reports/tr35/tr35-dates.html#intervalFormats
      // "For greatestDifference values corresponding to the time fields in the skeleton,
      // separate the skeleton into a date fields part and a time fields part... [and]
      // combine [them] using the dateTimeFormat"
      //
      // This matches the approach in ICU4J's DateIntervalFormat.concatSingleDate2TimeInterval()
      // See: https://android.googlesource.com/platform/external/icu/+/refs/heads/o-iot-preview-5/android_icu4j/src/main/java/android/icu/text/DateIntervalFormat.java
      //
      // When a skeleton combines date and time fields (e.g., "EyMMMdHm") and CLDR doesn't
      // provide interval formats for it, synthesize by combining the date pattern with time
      // interval patterns. This produces output like "Sun, 22 Sept 2024, 14:00 – 16:00"
      // instead of "Sun, 22 Sept 2024, 14:00 – Sun, 22 Sept 2024, 16:00"
      const combinedIntervalFormats = intervalFormats[skeleton]
      const timeIntervalFormats = intervalFormats[timeSkeleton]
      if (
        !combinedIntervalFormats &&
        timeIntervalFormats &&
        typeof timeIntervalFormats === 'object'
      ) {
        // Synthesize interval formats for each time field difference
        const synthesizedFormats: Record<string, string> = {}
        for (const [field, timeIntervalPattern] of Object.entries(
          timeIntervalFormats
        )) {
          if (typeof timeIntervalPattern === 'string') {
            // Combine date pattern with time interval pattern using dateTimeFormat
            const synthesizedPattern = rawPattern
              .replace('{0}', timeIntervalPattern)
              .replace('{1}', datePattern)
            synthesizedFormats[field] = synthesizedPattern
          }
        }
        if (Object.keys(synthesizedFormats).length > 0) {
          intervalFormats[skeleton] = synthesizedFormats
        }
      }
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
    // Include stand-alone month forms if they differ from format forms
    ...(gregorian.months['stand-alone'] &&
    (!isEqual(
      gregorian.months['stand-alone'].narrow,
      gregorian.months.format.narrow
    ) ||
      !isEqual(
        gregorian.months['stand-alone'].abbreviated,
        gregorian.months.format.abbreviated
      ) ||
      !isEqual(
        gregorian.months['stand-alone'].wide,
        gregorian.months.format.wide
      ))
      ? {
          monthStandalone: {
            narrow: Object.values(gregorian.months['stand-alone'].narrow),
            short: Object.values(gregorian.months['stand-alone'].abbreviated),
            long: Object.values(gregorian.months['stand-alone'].wide),
          },
        }
      : {}),
    timeZoneName,
    gmtFormat: timeZoneNames.gmtFormat,
    hourFormat: timeZoneNames.hourFormat,
    dateFormat: extractStyleFormatFields(gregorian.dateFormats),
    timeFormat: extractStyleFormatFields(gregorian.timeFormats),
    dateTimeFormat: extractStyleFormatFields(gregorian.dateTimeFormats),
    formats: {
      gregory: allFormats,
    },
    // @ts-ignore
    intervalFormats,
    hourCycle: hc[0],
    nu: nu ? [nu] : [],
    ca: (
      calendarPreferenceData[region as keyof typeof calendarPreferenceData] ||
      calendarPreferenceData['001']
    ).map(c => {
      //Resolve aliases per https://github.com/unicode-org/cldr/blob/master/common/bcp47/calendar.xml
      if (c === 'gregorian') {
        return 'gregory'
      }
      if (c === 'islamic-civil') {
        return 'islamicc'
      }
      if (c === 'ethiopic-amete-alem') {
        return 'ethioaa'
      }
      return c
    }),
    hc,
  }
}

export async function extractDatesFields(
  locales: string[] = AVAILABLE_LOCALES.availableLocales.full
): Promise<Record<string, RawDateTimeLocaleInternalData>> {
  const data = await Promise.all(locales.map(loadDatesFields))
  return locales.reduce(
    (all: Record<string, RawDateTimeLocaleInternalData>, locale, i) => {
      all[locale] = data[i]
      return all
    },
    {}
  )
}

/**
 * The CLDR formatObject has several fields other than full, long, medium, short which
 * would increase the size of the saved payload if not ommitted.
 * @param formatObject
 */
function extractStyleFormatFields<
  T extends {full: string; long: string; medium: string; short: string},
>(
  formatObject: T
): {full: string; long: string; medium: string; short: string} {
  return {
    full: formatObject.full,
    long: formatObject.long,
    medium: formatObject.medium,
    short: formatObject.short,
  }
}
