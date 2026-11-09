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
import numberingSystems from 'cldr-core/supplemental/numberingSystems.json' with {type: 'json'}
import {
  type RawDateTimeLocaleInternalData,
  type TimeZoneNameData,
} from '../types.ts'
import dayPeriodData from 'cldr-core/supplemental/dayPeriods.json' with {type: 'json'}
import parentLocaleData from 'cldr-core/supplemental/parentLocales.json' with {type: 'json'}
import rawTimeData from 'cldr-core/supplemental/timeData.json' with {type: 'json'}
import TimeZoneNames from 'cldr-dates-full/main/en/timeZoneNames.json' with {type: 'json'}
import metaZones from 'cldr-core/supplemental/metaZones.json' with {type: 'json'}
import timeZoneAliases from 'cldr-bcp47/bcp47/timezone.json' with {type: 'json'}
import primaryZones from 'cldr-core/supplemental/primaryZones.json' with {type: 'json'}
import type Territories from 'cldr-localenames-full/main/en/territories.json' with {type: 'json'}
import IntlLocale from '@formatjs/intl-locale'
import type {Formats} from '#packages/ecma402-abstract/types/date-time.js'
import {
  parseDateTimeSkeleton,
  processDateTimePattern,
} from '#packages/ecma402-abstract/DateTimeFormat/skeleton.js'
import {isEqual} from 'lodash-es'
import {calendarFiles as CALENDAR_FILES} from '@formatjs_generated/datetimeformat.calendars/index.js'
import type {IsoPatterns} from './iso-patterns.ts'
const ERA_KEY = /^\d+$/

function extractEras(eras: Record<string, string>, calendar: string) {
  return Object.fromEntries(
    Object.entries(eras)
      .filter(([key]) => ERA_KEY.test(key))
      .map(([key, value]) => [
        calendar === 'gregory' || calendar === 'iso8601'
          ? key === '0'
            ? 'BC'
            : 'AD'
          : key,
        value,
      ])
  )
}

const NON_SKELETON_LETTERS = /[^a-zA-Z]/g
const DAY_PERIOD_LETTERS = /[ab]/g
const REPEATED_SKELETON_LETTERS = /(.)\1+/g

const {timeData} = rawTimeData.supplemental
const processedTimeData = Object.keys(timeData).reduce(
  (all: Record<string, string[]>, k) => {
    const {_preferred, _allowed} = timeData[k as keyof typeof timeData]
    all[k.replace('_', '-')] = [
      _preferred,
      ..._allowed.split(' ').filter(value => value !== _preferred),
    ]
    return all
  },
  {}
)

function getDayPeriodRules(
  locale: string
): RawDateTimeLocaleInternalData['dayPeriodRules'] {
  const rules: Record<
    string,
    Record<string, {_at?: string; _from?: string; _before?: string}>
  > = dayPeriodData.supplemental.dayPeriodRuleSet
  const parents: Record<string, string> =
    parentLocaleData.supplemental.parentLocales.parentLocale
  while (locale && !rules[locale]) {
    locale = parents[locale] || locale.split('-').slice(0, -1).join('-')
  }
  const time = (value: string | undefined) => {
    if (value === undefined) return undefined
    const [hour, minute] = value.split(':').map(Number)
    return (hour * 60 + minute) * 60000
  }
  // LDML Day Period Rules, Fixed periods: midnight is optional and ambiguous.
  // Keep 00:00 in its variable period; there is no caller-provided midnight context.
  // https://unicode.org/reports/tr35/tr35-dates.html#Day_Period_Rules
  // https://github.com/unicode-org/cldr/blob/acd6d88ae493633240e19a87a721076a8a75c310/docs/ldml/tr35-dates.md#L1341-L1375
  return Object.entries(rules[locale] || {})
    .filter(([name]) => name !== 'midnight')
    .map(([name, rule]) => ({
      name,
      at: time(rule._at),
      from: time(rule._from),
      before: time(rule._before),
    }))
}

function isDateFormatOnly(opts: Intl.DateTimeFormatOptions) {
  return !Object.keys(opts).find(
    k =>
      k === 'dayPeriod' ||
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

function withoutZone(pattern: string): string {
  let quoted = false
  for (let index = 0; index < pattern.length; index++) {
    const character = pattern[index]
    if (character === "'") {
      if (pattern[index + 1] === "'") index++
      else quoted = !quoted
    } else if (!quoted && 'zvO'.includes(character)) {
      let end = index + 1
      while (pattern[end] === character) end++
      let start = index
      if (pattern[index - 1] === '(' && pattern[end] === ')') {
        start--
        end++
      }
      return (pattern.slice(0, start) + pattern.slice(end)).trim()
    }
  }
  return pattern
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
  // CLDR hB/hb variants keep the same hour cycle and change only day periods.
  switch (token[0]) {
    case 'h':
      return 'h12'
    case 'H':
      return 'h23'
    case 'K':
      return 'h11'
    case 'k':
      return 'h24'
  }
  throw new Error(`Unsupported hour cycle token: ${token}`)
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

function isDefaultDataKey(k: string): boolean {
  // CLDR JSON encodes the alt attribute in the key, not in the skeleton.
  // Alternate labels such as -alt-ascii must never become date fields.
  // LDML Attribute alt (no numbered steps).
  // https://unicode.org/reports/tr35/tr35.html#alt_attribute
  // https://github.com/unicode-org/cldr/blob/acd6d88ae493633240e19a87a721076a8a75c310/docs/ldml/tr35.md#L3166-L3172
  return !k.includes('-alt-')
}

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

  for (const entry of Object.values(timeZoneAliases.keyword.u.tz)) {
    if (typeof entry !== 'object' || !('_alias' in entry)) continue
    const aliases = entry._alias.split(' ')
    const metazone = aliases.map(alias => map[alias]).find(Boolean)
    if (metazone) for (const alias of aliases) map[alias] = metazone
  }
  return map
}

const tzToMetaZoneMap = extractTimezoneToMetazoneMap()
const zoneLocations: Record<
  string,
  {region: string; city: string; primary: boolean}
> = {}
const regionZones: Record<string, string[]> = {}
for (const [key, entry] of Object.entries(timeZoneAliases.keyword.u.tz)) {
  if (typeof entry !== 'object' || !('_alias' in entry)) continue
  const aliases = entry._alias.split(' ')
  const region =
    '_region' in entry ? String(entry._region) : key.slice(0, 2).toUpperCase()
  ;(regionZones[region] ||= []).push(aliases[0])
  for (const alias of aliases) {
    zoneLocations[alias] = {
      region,
      city: aliases[0],
      primary: aliases.includes(
        primaryZones.supplemental.primaryZones[region as 'NZ']
      ),
    }
  }
}

async function loadDatesFields(
  locale: string,
  calendar = 'gregory',
  iso?: IsoPatterns
): Promise<RawDateTimeLocaleInternalData> {
  const calendarFile = CALENDAR_FILES[calendar]
  const territoryLocale = locale === 'und' ? 'en' : locale
  const calendarName = calendarFile?.[1] ?? 'gregorian'
  const [caGregorianImport, tznImport, numbersImport, territoriesImport] =
    await Promise.all([
      import(
        calendarFile
          ? `cldr-cal-${calendarFile[0]}-full/main/${locale}/ca-${calendarName}.json`
          : `cldr-dates-full/main/${locale}/ca-gregorian.json`,
        {
          with: {type: 'json'},
        }
      ) as Promise<{default: typeof DateFields}>,
      import(`cldr-dates-full/main/${locale}/timeZoneNames.json`, {
        with: {type: 'json'},
      }) as Promise<{default: typeof TimeZoneNames}>,
      import(`cldr-numbers-full/main/${locale}/numbers.json`, {
        with: {type: 'json'},
      }).catch(_ => undefined) as Promise<
        {default: typeof NumberFields} | undefined
      >,
      import(`cldr-localenames-full/main/${territoryLocale}/territories.json`, {
        with: {type: 'json'},
      }) as Promise<{default: typeof Territories}>,
    ])
  let calendarFields =
    caGregorianImport.default.main[locale as 'en'].dates.calendars[
      calendarName as 'gregorian'
    ]
  if (calendar === 'iso8601' && iso) {
    calendarFields = {
      ...calendarFields,
      dateFormats: iso.dateFormats,
      timeFormats: iso.timeFormats,
      dateTimeFormats: {
        ...calendarFields.dateTimeFormats,
        ...iso.dateTimeFormats,
      },
      'dateTimeFormats-atTime': {standard: iso.dateTimeFormats},
    } as typeof calendarFields
  }
  const gregorianEras =
    calendar === 'japanese'
      ? (
          await import(`cldr-dates-full/main/${locale}/ca-gregorian.json`, {
            with: {type: 'json'},
          })
        ).default.main[locale].dates.calendars.gregorian.eras
      : undefined
  const timeZoneNames =
    tznImport.default.main[locale as 'en'].dates.timeZoneNames
  const numbers = numbersImport?.default.main[locale as 'en'].numbers
  // ECMA-402 11.1.2, step 11: resolve [[NumberingSystem]] from [[nu]].
  // Keep the locale default first; NumberFormat supplies digits for every system.
  // https://tc39.es/ecma402/#sec-createdatetimeformat
  // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/datetimeformat.html#L76
  const nu = numbers
    ? [
        numbers.defaultNumberingSystem,
        ...Object.keys(numberingSystems.supplemental.numberingSystems).filter(
          name =>
            name !== numbers.defaultNumberingSystem &&
            numberingSystems.supplemental.numberingSystems[name as 'latn']
              ._type === 'numeric'
        ),
      ]
    : []

  let hc: string[] = []
  let hourCycle12 = 'h12'
  let hourCycle24 = 'h23'
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
    hourCycle12 = hc.find(cycle => cycle === 'h11' || cycle === 'h12') || 'h12'
    hourCycle24 = hc.find(cycle => cycle === 'h23' || cycle === 'h24') || 'h23'
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
            if (metazoneInfo.long?.standard) {
              all[tz].long = [
                metazoneInfo.long.standard,
                'daylight' in metazoneInfo.long
                  ? metazoneInfo.long.daylight
                  : metazoneInfo.long.standard,
              ]
            }
            if ('short' in metazoneInfo && metazoneInfo.short.standard) {
              all[tz].short = [
                metazoneInfo.short.standard,
                'daylight' in metazoneInfo.short
                  ? metazoneInfo.short.daylight
                  : metazoneInfo.short.standard,
              ]
            }
            const location = zoneLocations[tz]
            const territories =
              territoriesImport.default.main[territoryLocale as 'en']
                .localeDisplayNames.territories
            let locationName: string | undefined
            if (location && territories) {
              const country = territories[location.region as 'NZ']
              if (country) {
                const city = location.city
                  .split('/')
                  .reduce<unknown>(
                    (value, key) =>
                      (value as Record<string, unknown> | undefined)?.[key],
                    timeZoneNames.zone
                  ) as {exemplarCity?: string} | undefined
                locationName = timeZoneNames.regionFormat.replace(
                  '{0}',
                  location.primary || regionZones[location.region].length === 1
                    ? country
                    : city?.exemplarCity ||
                        location.city.split('/').at(-1)!.replaceAll('_', ' ')
                )
              }
            }
            all[tz].longGeneric =
              metazoneInfo.long?.generic ||
              (!metazoneInfo.long?.daylight
                ? metazoneInfo.long?.standard
                : undefined) ||
              locationName
            all[tz].shortGeneric =
              ('short' in metazoneInfo
                ? metazoneInfo.short.generic
                : undefined) || locationName
          }

          return all
        }, {})
    const {long: utcLong, short: utcShort} = timeZoneNames.zone.Etc.UTC
    timeZoneName.UTC = {}
    if (utcLong?.standard) {
      timeZoneName.UTC.long = [utcLong.standard, utcLong.standard]
    }
    if (utcShort?.standard) {
      timeZoneName.UTC.short = [utcShort.standard, utcShort.standard]
    }
  } catch (e) {
    console.error(`Issue extracting timeZoneName for ${locale}`)
    throw e
  }

  const {short, full, medium, long} = calendarFields.dateTimeFormats
  const atTime =
    calendarFields['dateTimeFormats-atTime']?.standard ||
    calendarFields.dateTimeFormats

  const {availableFormats} = calendarFields.dateTimeFormats
  const rawIntervalFormats = calendarFields.dateTimeFormats.intervalFormats
  const intervalFormats = Object.keys(rawIntervalFormats)
    .filter(isDefaultDataKey)
    .reduce((all: Record<string, string | Record<string, string>>, k) => {
      const v = rawIntervalFormats[k as 'Bhm']
      all[k] = typeof v === 'string' ? v : filterKeys(v, isDefaultDataKey)
      return all
    }, {})
  const intervalFallback = intervalFormats.intervalFormatFallback
  if (typeof intervalFallback === 'string') {
    for (const [skeleton, ranges] of Object.entries(intervalFormats)) {
      if (typeof ranges !== 'object') continue
      const single = availableFormats[skeleton as 'Bh']
      if (typeof single !== 'string') continue
      const [, singlePattern] = processDateTimePattern(single)
      if (!singlePattern.includes('{ampm}')) continue
      for (const field of ['a', 'b']) {
        if (!ranges[field]) continue
        const [, rangePattern] = processDateTimePattern(ranges[field])
        // Differing AM/PM values must both survive the interval.
        if (rangePattern.split('{ampm}').length !== 3) {
          ranges[field] = intervalFallback
            .replace('{0}', single)
            .replace('{1}', single)
        }
      }
    }
  }
  const parsedAvailableFormats: Array<[string, string, Formats]> = Object.keys(
    availableFormats
  )
    .filter(isDefaultDataKey)
    // Numeric year options prefer ordinary year skeletons over cyclic names.
    .sort(
      (left, right) => Number(left.includes('U')) - Number(right.includes('U'))
    )
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
  const dateFormats = Object.entries(calendarFields.dateFormats)
    .filter(([key]) => isDefaultDataKey(key))
    .map(([, value]) => value)
    .reduce((all: Record<string, string>, v) => {
      // Locale haw got some weird structure https://github.com/unicode-cldr/cldr-dates-full/blob/master/main/haw/ca-gregorian.json
      const pattern = typeof v === 'object' ? (v as {_value: string})._value : v
      all[pattern] = pattern
      return all
    }, {})
  const timeFormats = Object.entries(calendarFields.timeFormats)
    .filter(([key]) => isDefaultDataKey(key))
    .map(([, value]) => value)
    .reduce((all: Record<string, string>, v) => {
      // Locale haw got some weird structure https://github.com/unicode-cldr/cldr-dates-full/blob/master/main/haw/ca-gregorian.json
      all[v] = v
      return all
    }, {})
  const allFormats: Record<string, string> = {
    // LDML Date Field Symbol Table: standalone B uses the requested name width.
    // https://unicode.org/reports/tr35/tr35-dates.html#Date_Field_Symbol_Table
    // https://github.com/unicode-org/cldr/blob/acd6d88ae493633240e19a87a721076a8a75c310/docs/ldml/tr35-dates.md#L2235-L2240
    B: 'B',
    BBBB: 'BBBB',
    BBBBB: 'BBBBB',
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
      const cyclic = (availableFormats as Record<string, string>).UMd
      const tokens = processDateTimePattern(pattern)[0]
      if (
        cyclic &&
        typeof intervalFallback === 'string' &&
        tokens.includes('{yearName}') &&
        !tokens.includes('{relatedYear}') &&
        availableFormatEntry.year &&
        availableFormatEntry.day &&
        !availableFormatEntry.era &&
        !availableFormatEntry.weekday &&
        (availableFormatEntry.month === 'numeric' ||
          availableFormatEntry.month === '2-digit')
      ) {
        const complete = intervalFallback
          .replace('{0}', cyclic)
          .replace('{1}', cyclic)
        intervalFormats[skeleton] = {date: complete}
      }
    } else if (isTimeFormatOnly(availableFormatEntry)) {
      timeFormats[skeleton] = pattern
    }
  }
  // Explicit minute/second widths can require appendItems rather than an
  // availableFormats entry whose skeleton has different widths.
  const appendZone = calendarFields.dateTimeFormats.appendItems.Timezone
  for (const [skeleton, pattern, fields] of parsedAvailableFormats) {
    if (
      !isTimeFormatOnly(fields) ||
      !fields.hour ||
      !fields.minute ||
      fields.timeZoneName ||
      fields.dayPeriod
    )
      continue
    const zoned = availableFormats[(skeleton + 'v') as 'Hmv']
    const timePattern = typeof zoned === 'string' ? withoutZone(zoned) : pattern
    const widths = skeleton.replace(/m+/g, 'mm').replace(/s+/g, 'ss')
    for (const zone of ['z', 'zzzz', 'v', 'vvvv', 'O', 'OOOO']) {
      const key = widths + zone
      if (allFormats[key]) continue
      const expanded = appendZone
        .replace('{0}', timePattern)
        .replace('{1}', zone)
      allFormats[key] = expanded
      timeFormats[key] = expanded
    }
  }
  const timeIntervals = parsedAvailableFormats.filter(
    ([key, , fields]) =>
      isTimeFormatOnly(fields) && typeof intervalFormats[key] === 'object'
  )
  const rangeTimePatterns = new Map<string, string>()
  function rangeTimePattern(skeleton: string, pattern: string): string {
    const cached = rangeTimePatterns.get(skeleton)
    if (cached !== undefined) return cached
    if (skeleton === pattern) {
      rangeTimePatterns.set(skeleton, pattern)
      return pattern
    }
    const target = parseDateTimeSkeleton(pattern)
    let result = pattern
    if (target.timeZoneName) {
      let bestScore = Infinity
      for (const [, candidatePattern, candidate] of parsedAvailableFormats) {
        if (!isTimeFormatOnly(candidate)) continue
        if (
          !!target.hour12 !== !!candidate.hour12 ||
          !(
            [
              'hour',
              'minute',
              'second',
              'dayPeriod',
              'timeZoneName',
              'fractionalSecondDigits',
            ] as const
          ).every(
            field =>
              (target[field] !== undefined) === (candidate[field] !== undefined)
          )
        )
          continue
        const score =
          Number(target.minute !== candidate.minute) +
          Number(target.second !== candidate.second)
        if (score < bestScore) {
          bestScore = score
          const zone = {
            short: 'z',
            long: 'zzzz',
            shortGeneric: 'v',
            longGeneric: 'vvvv',
            shortOffset: 'O',
            longOffset: 'OOOO',
          }[target.timeZoneName]
          result = appendZone
            .replace('{0}', withoutZone(candidatePattern))
            .replace('{1}', zone)
        }
      }
    }
    rangeTimePatterns.set(skeleton, result)
    return result
  }
  const intervalFormatTemplates: NonNullable<
    RawDateTimeLocaleInternalData['intervalFormatTemplates']
  > = {dates: [], times: []}
  const templateDates = new Set<string>()
  const templateTimes = new Set<string>()
  const parsedDates = Object.entries(dateFormats)
    .sort(
      ([left], [right]) =>
        Number(!/^[a-zA-Z]+$/.test(left)) - Number(!/^[a-zA-Z]+$/.test(right))
    )
    .map(
      ([skeleton, pattern]) =>
        [
          skeleton,
          pattern,
          parseDateTimeSkeleton(skeleton, pattern),
          parseDateTimeSkeleton(pattern),
        ] as const
    )
  // Based on https://unicode.org/reports/tr35/tr35-dates.html#Missing_Skeleton_Fields
  for (const [timeSkeleton, timePattern] of Object.entries(timeFormats)) {
    const intervalTimePattern = rangeTimePattern(timeSkeleton, timePattern)
    for (const [dateSkeleton, datePattern, entry, actualDate] of parsedDates) {
      const numericMonth =
        actualDate.month === 'numeric' || actualDate.month === '2-digit'
      const intervalDateKey = numericMonth
        ? dateSkeleton.replace(/[ML]+/g, 'M')
        : dateSkeleton
      const intervalDate =
        availableFormats[intervalDateKey as 'yMd'] || datePattern
      let rawPattern
      if (entry.month === 'long') {
        rawPattern = entry.weekday ? full : long
      } else if (entry.month === 'short') {
        rawPattern = medium
      } else {
        rawPattern = short
      }
      const singleConnector =
        entry.month === 'long'
          ? entry.weekday
            ? atTime.full
            : atTime.long
          : entry.month === 'short'
            ? atTime.medium
            : atTime.short
      const pattern = singleConnector
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
      if (!templateDates.has(dateSkeleton)) {
        templateDates.add(dateSkeleton)
        intervalFormatTemplates.dates.push([
          dateSkeleton,
          intervalDate,
          rawPattern,
          singleConnector,
        ])
      }
      const canonicalTimeSkeleton = timeSkeleton
        .replace(NON_SKELETON_LETTERS, '')
        .replace(DAY_PERIOD_LETTERS, '')
        .replace(REPEATED_SKELETON_LETTERS, '$1')
      const intervalTimeSkeleton = canonicalTimeSkeleton.replace(
        /[zZOvV]/g,
        'v'
      )
      let timeIntervalFormats =
        intervalFormats[timeSkeleton] ||
        intervalFormats[canonicalTimeSkeleton] ||
        intervalFormats[intervalTimeSkeleton]

      // GH #4535: If interval formats for the time skeleton don't exist, try the 24-hour variant.
      // This handles cases where CLDR provides formats for 'Hm' but not 'hm', or vice versa.
      //
      // Similar to ICU4J's normalizeHourMetacharacters() which converts between hour cycles.
      // See: https://github.com/unicode-org/icu/blob/main/icu4j/main/core/src/main/java/com/ibm/icu/text/DateIntervalFormat.java
      //
      // LDML Spec (UTS #35): "If no exact match exists, check the fallback locale chain,
      // allowing adjustments to field widths and variant field types."
      // See: https://unicode.org/reports/tr35/tr35-dates.html#intervalFormats
      if (
        !timeIntervalFormats ||
        typeof timeIntervalFormats !== 'object' ||
        Object.keys(timeIntervalFormats).length === 0
      ) {
        // Convert between 12-hour (h/K) and 24-hour (H/k) hour symbols
        const alt24HourSkeleton = canonicalTimeSkeleton
          .replace(/h/g, 'H')
          .replace(/K/g, 'k')
        const alt12HourSkeleton = canonicalTimeSkeleton
          .replace(/H/g, 'h')
          .replace(/k/g, 'K')

        if (alt24HourSkeleton !== canonicalTimeSkeleton) {
          timeIntervalFormats = intervalFormats[alt24HourSkeleton]
        } else if (alt12HourSkeleton !== canonicalTimeSkeleton) {
          timeIntervalFormats = intervalFormats[alt12HourSkeleton]
        }
      }

      if (!templateTimes.has(timeSkeleton)) {
        const timeRanges =
          typeof timeIntervalFormats === 'object'
            ? {...timeIntervalFormats}
            : {}
        const fallback = intervalFormats.intervalFormatFallback
        if (typeof fallback === 'string') {
          const fallbackTimeRange = fallback
            .replace('{0}', timePattern)
            .replace('{1}', timePattern)
          timeRanges.fallback = fallbackTimeRange
        }
        templateTimes.add(timeSkeleton)
        intervalFormatTemplates.times.push([
          timeSkeleton,
          intervalTimePattern,
          timeRanges,
        ])
      }
    }
  }
  // Time-only intervals still need dates when the endpoints span calendar days.
  // https://unicode.org/reports/tr35/tr35-dates.html#intervalFormats
  const numericDate = availableFormats.yMd
  if (typeof numericDate === 'string' && typeof intervalFallback === 'string') {
    for (const [skeleton, timePattern] of Object.entries(timeFormats)) {
      const target = parseDateTimeSkeleton(skeleton, timePattern)
      if (!isTimeFormatOnly(target)) continue
      const exact = intervalFormats[skeleton]
      const compatible = timeIntervals.find(([, , candidate]) => {
        return (
          !!target.hour12 === !!candidate.hour12 &&
          [
            'year',
            'month',
            'day',
            'weekday',
            'dayPeriod',
            'hour',
            'minute',
            'second',
            'timeZoneName',
          ].every(
            field =>
              (target[field as 'hour'] !== undefined) ===
              (candidate[field as 'hour'] !== undefined)
          )
        )
      })?.[0]
      const compatibleRanges = compatible && intervalFormats[compatible]
      const ranges = typeof exact === 'object' ? exact : compatibleRanges
      const endpoint = atTime.short
        .replace('{0}', rangeTimePattern(skeleton, timePattern))
        .replace('{1}', numericDate)
      const dateRange = intervalFallback
        .replace('{0}', endpoint)
        .replace('{1}', endpoint)
      intervalFormats[skeleton] = {
        ...(typeof ranges === 'object' ? ranges : {}),
        date: dateRange,
      }
    }
  }
  const extractMonths = (names: Record<string, string>) => {
    if (calendar !== 'hebrew') return Object.values(names)
    return [
      ...Array.from({length: 13}, (_, index) => names[String(index + 1)]),
      names['7-yeartype-leap'],
    ]
  }
  const lunar = calendarFields as typeof calendarFields & {
    cyclicNameSets?: {years: {format: {abbreviated: Record<string, string>}}}
    monthPatterns?: Record<string, Record<string, {leap: string}>>
  }
  const leapWidths = (patterns: Record<string, {leap: string}>) => ({
    narrow: patterns.narrow.leap,
    short: patterns.abbreviated.leap,
    long: patterns.wide.leap,
  })
  return {
    yearNames:
      lunar.cyclicNameSets &&
      Object.values(lunar.cyclicNameSets.years.format.abbreviated),
    leapMonthPatterns: lunar.monthPatterns && {
      numeric: lunar.monthPatterns.numeric.all.leap,
      format: leapWidths(lunar.monthPatterns.format),
      standalone: leapWidths(lunar.monthPatterns['stand-alone']),
    },
    am: calendarFields.dayPeriods.format.abbreviated.am,
    pm: calendarFields.dayPeriods.format.abbreviated.pm,
    dayPeriods: {
      narrow: calendarFields.dayPeriods.format.narrow,
      short: calendarFields.dayPeriods.format.abbreviated,
      long: calendarFields.dayPeriods.format.wide,
    },
    dayPeriodRules: getDayPeriodRules(locale),
    weekday: {
      narrow: Object.values(calendarFields.days.format.narrow),
      short: Object.values(calendarFields.days.format.abbreviated),
      long: Object.values(calendarFields.days.format.wide),
    },
    // Include stand-alone weekday forms if they differ from format forms
    ...(calendarFields.days['stand-alone'] &&
    (!isEqual(
      calendarFields.days['stand-alone'].narrow,
      calendarFields.days.format.narrow
    ) ||
      !isEqual(
        calendarFields.days['stand-alone'].abbreviated,
        calendarFields.days.format.abbreviated
      ) ||
      !isEqual(
        calendarFields.days['stand-alone'].wide,
        calendarFields.days.format.wide
      ))
      ? {
          weekdayStandalone: {
            narrow: Object.values(calendarFields.days['stand-alone'].narrow),
            short: Object.values(
              calendarFields.days['stand-alone'].abbreviated
            ),
            long: Object.values(calendarFields.days['stand-alone'].wide),
          },
        }
      : {}),
    era: {
      narrow: {
        ...extractEras(calendarFields.eras?.eraNarrow ?? {}, calendar),
        ...(gregorianEras
          ? extractEras(gregorianEras.eraNarrow, 'gregory')
          : {}),
      },
      short: {
        ...extractEras(calendarFields.eras?.eraAbbr ?? {}, calendar),
        ...(gregorianEras ? extractEras(gregorianEras.eraAbbr, 'gregory') : {}),
      },
      long: {
        ...extractEras(calendarFields.eras?.eraNames ?? {}, calendar),
        ...(gregorianEras
          ? extractEras(gregorianEras.eraNames, 'gregory')
          : {}),
      },
    },
    month: {
      narrow: extractMonths(calendarFields.months.format.narrow),
      short: extractMonths(calendarFields.months.format.abbreviated),
      long: extractMonths(calendarFields.months.format.wide),
    },
    // Include stand-alone month forms if they differ from format forms
    ...(calendarFields.months['stand-alone'] &&
    (!isEqual(
      calendarFields.months['stand-alone'].narrow,
      calendarFields.months.format.narrow
    ) ||
      !isEqual(
        calendarFields.months['stand-alone'].abbreviated,
        calendarFields.months.format.abbreviated
      ) ||
      !isEqual(
        calendarFields.months['stand-alone'].wide,
        calendarFields.months.format.wide
      ))
      ? {
          monthStandalone: {
            narrow: extractMonths(calendarFields.months['stand-alone'].narrow),
            short: extractMonths(
              calendarFields.months['stand-alone'].abbreviated
            ),
            long: extractMonths(calendarFields.months['stand-alone'].wide),
          },
        }
      : {}),
    timeZoneName,
    gmtFormat: timeZoneNames.gmtFormat,
    hourFormat: timeZoneNames.hourFormat,
    dateFormat: extractStyleFormatFields(calendarFields.dateFormats),
    timeFormat: extractStyleFormatFields(calendarFields.timeFormats),
    dateTimeFormat: extractStyleFormatFields(calendarFields.dateTimeFormats),
    dateTimeFormatAtTime: extractStyleFormatFields(atTime),
    formats: {
      [calendar]: allFormats,
    },
    // @ts-ignore
    intervalFormats,
    intervalFormatTemplates,
    hourCycle: hc[0],
    hourCycle12,
    hourCycle24,
    nu,
    // ECMA-402 §6.9.1 AvailableCalendars requires iso8601 and limits
    // advertised calendars to implemented functionality (no numbered steps).
    // https://tc39.es/ecma402/#sec-availablecalendars
    // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/locales-currencies-tz.html#L523-L527
    ca: ['gregory', 'iso8601'],
    // ECMA-402 §11.2.3 requires null followed by all four cycles. The
    // null sentinel lets hour12 override an hc extension during resolution.
    // https://tc39.es/ecma402/#sec-intl.datetimeformat-internal-slots
    // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/datetimeformat.html#L229
    hc: [null, 'h11', 'h12', 'h23', 'h24'],
  }
}

export async function extractDatesFields(
  locales: string[] = AVAILABLE_LOCALES.availableLocales.full,
  isoPatterns?: (locale: string) => IsoPatterns
): Promise<Record<string, RawDateTimeLocaleInternalData>> {
  const data = await Promise.all(
    locales.map(async locale => {
      const data = await loadDatesFields(locale)
      data.calendarData = {}
      const calendars = await Promise.all(
        Object.keys(CALENDAR_FILES).map(
          async calendar =>
            [calendar, await loadDatesFields(locale, calendar)] as const
        )
      )
      if (isoPatterns)
        calendars.push([
          'iso8601',
          await loadDatesFields(locale, 'iso8601', isoPatterns(locale)),
        ])
      for (const [calendar, fields] of calendars) {
        const {
          era,
          month,
          monthStandalone,
          yearNames,
          leapMonthPatterns,
          dateFormat,
          timeFormat,
          dateTimeFormat,
          dateTimeFormatAtTime,
          intervalFormats,
          intervalFormatTemplates,
        } = fields
        data.calendarData[calendar] = {
          era,
          month,
          // Explicit defaults prevent inheriting Gregorian standalone names.
          monthStandalone: monthStandalone ?? month,
          yearNames,
          leapMonthPatterns,
          dateFormat,
          timeFormat,
          dateTimeFormat,
          dateTimeFormatAtTime,
          intervalFormats,
          intervalFormatTemplates,
        }
        data.formats[calendar] = fields.formats[calendar]
        if (!data.ca.includes(calendar)) data.ca.push(calendar)
      }
      return data
    })
  )
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
function extractStyleFormatFields(
  formatObject: Record<
    'full' | 'long' | 'medium' | 'short',
    string | {_value: string}
  >
): {full: string; long: string; medium: string; short: string} {
  const pattern = (value: string | {_value: string}) =>
    typeof value === 'string' ? value : value._value
  return {
    full: pattern(formatObject.full),
    long: pattern(formatObject.long),
    medium: pattern(formatObject.medium),
    short: pattern(formatObject.short),
  }
}
