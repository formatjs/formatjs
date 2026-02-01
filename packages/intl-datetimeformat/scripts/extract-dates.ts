/*
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
'use strict'

import DateFields from 'cldr-dates-full/main/en/ca-gregorian.json' with {type: 'json'}
import NumberFields from 'cldr-numbers-full/main/en/numbers.json' with {type: 'json'}
import glob from 'fast-glob'
const globSync = glob.sync
import {resolve, dirname} from 'path'
import {createRequire} from 'node:module'

const require = createRequire(import.meta.url)
import AVAILABLE_LOCALES from 'cldr-core/availableLocales.json' with {type: 'json'}
import {
  type RawDateTimeLocaleInternalData,
  type TimeZoneNameData,
} from '../src/types.ts'
import rawTimeData from 'cldr-core/supplemental/timeData.json' with {type: 'json'}
import rawCalendarPreferenceData from 'cldr-core/supplemental/calendarPreferenceData.json' with {type: 'json'}
import TimeZoneNames from 'cldr-dates-full/main/en/timeZoneNames.json' with {type: 'json'}
import metaZones from 'cldr-core/supplemental/metaZones.json' with {type: 'json'}
import IntlLocale from '@formatjs/intl-locale'
import {type Formats} from '@formatjs/ecma402-abstract'
import {parseDateTimeSkeleton} from '../src/abstract/skeleton.ts'
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
 * Extract timezone-to-metazone mappings from CLDR data.
 *
 * CLDR provides timezone-to-metazone mappings in two structures:
 * 1. `metazones` array: Contains only "golden zones" (territory="001") - one reference
 *    zone per metazone (~322 entries). These are the canonical exemplar zones.
 * 2. `metazoneInfo.timezone`: Contains ALL IANA timezone mappings organized by
 *    continent (~418 entries). This is what ICU4J uses.
 *
 * This implementation matches ICU4J's approach by parsing the complete metazoneInfo
 * structure to get all timezone-to-metazone mappings. This ensures that zones like
 * America/Detroit and America/Phoenix get proper timezone abbreviations (EDT/EST/MST)
 * instead of falling back to "GMT-4" or "GMT-7".
 *
 * Example mappings from metazoneInfo:
 * - America/Detroit → America_Eastern (shows EDT/EST)
 * - America/Phoenix → America_Mountain (shows MST)
 * - America/New_York → America_Eastern (shows EDT/EST)
 *
 * See: https://unicode-org.github.io/icu-docs/apidoc/dev/icu4j/com/ibm/icu/text/TimeZoneNames.html
 * See: https://github.com/formatjs/formatjs/issues/4456
 *
 * Note: Some timezones can map to multiple metazones over time due to historical
 * changes. We currently use the most recent mapping.
 */
function extractTimezoneToMetazoneMap(): Record<string, string> {
  const map: Record<string, string> = {}
  const metazoneInfo = metaZones.supplemental.metaZones.metazoneInfo.timezone

  // Iterate through all continents (Africa, America, Antarctica, etc.)
  for (const continent of Object.keys(metazoneInfo)) {
    const zones = metazoneInfo[continent as keyof typeof metazoneInfo]
    if (typeof zones !== 'object' || zones === null) continue

    // Iterate through all zones in this continent
    for (const zone of Object.keys(zones)) {
      const fullZoneName = `${continent}/${zone}`
      const zoneData = zones[zone as keyof typeof zones]

      // zoneData is an array of metazone usage entries with date ranges
      if (Array.isArray(zoneData) && zoneData.length > 0) {
        // Use the most recent metazone mapping (last entry in the array)
        const latestMapping = zoneData[zoneData.length - 1]
        if (latestMapping?.usesMetazone?._mzone) {
          map[fullZoneName] = latestMapping.usesMetazone._mzone
        }
      }
    }
  }

  return map
}

const tzToMetaZoneMap = extractTimezoneToMetazoneMap()

async function loadDatesFields(
  locale: string
): Promise<RawDateTimeLocaleInternalData> {
  const [caGregorianImport, tznImport, numbersImport] = await Promise.all([
    import(`cldr-dates-full/main/${locale}/ca-gregorian.json`, {
      with: {type: 'json'},
    }) as Promise<{default: typeof DateFields}>,
    import(`cldr-dates-full/main/${locale}/timeZoneNames.json`, {
      with: {type: 'json'},
    }) as Promise<{default: typeof TimeZoneNames}>,
    import(`cldr-numbers-full/main/${locale}/numbers.json`, {
      with: {type: 'json'},
    }).catch(_ => undefined) as Promise<
      {default: typeof NumberFields} | undefined
    >,
  ])
  const gregorian =
    caGregorianImport.default.main[locale as 'en'].dates.calendars.gregorian
  const timeZoneNames =
    tznImport.default.main[locale as 'en'].dates.timeZoneNames
  const nu =
    numbersImport?.default.main[locale as 'en'].numbers.defaultNumberingSystem

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
      let timeIntervalFormats = intervalFormats[timeSkeleton]

      // GH #4535: If interval formats for the time skeleton don't exist, try the 24-hour variant.
      // This handles cases where CLDR provides formats for 'Hm' but not 'hm', or vice versa.
      //
      // Similar to ICU4J's normalizeHourMetacharacters() which converts between hour cycles.
      // See: https://github.com/unicode-org/icu/blob/main/icu4j/main/core/src/main/java/com/ibm/icu/text/DateIntervalFormat.java
      //
      // LDML Spec (UTS #35): "If no exact match exists, check the fallback locale chain,
      // allowing adjustments to field widths and variant field types."
      // See: https://unicode.org/reports/tr35/tr35-dates.html#intervalFormats
      if (!timeIntervalFormats || typeof timeIntervalFormats !== 'object') {
        // Convert between 12-hour (h/K) and 24-hour (H/k) hour symbols
        const alt24HourSkeleton = timeSkeleton
          .replace(/h/g, 'H')
          .replace(/K/g, 'k')
        const alt12HourSkeleton = timeSkeleton
          .replace(/H/g, 'h')
          .replace(/k/g, 'K')

        if (alt24HourSkeleton !== timeSkeleton) {
          timeIntervalFormats = intervalFormats[alt24HourSkeleton]
        } else if (alt12HourSkeleton !== timeSkeleton) {
          timeIntervalFormats = intervalFormats[alt12HourSkeleton]
        }
      }

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
