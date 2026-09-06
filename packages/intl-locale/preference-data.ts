import {timezones} from '@formatjs_generated/cldr.locale/timezones.js'
import {hourCycles} from '@formatjs_generated/cldr.locale/hour-cycles.js'
import {calendars} from '@formatjs_generated/cldr.locale/calendars.js'
import {weekData} from '@formatjs_generated/cldr.locale/week-data.js'

import type {TimezonesTerritory} from '@formatjs_generated/cldr.locale/timezones.js'
import type {HourCyclesKey} from '@formatjs_generated/cldr.locale/hour-cycles.js'
import type {CalendarsKey} from '@formatjs_generated/cldr.locale/calendars.js'
import type {
  WeekDataKey,
  WeekInfoInternal,
} from '@formatjs_generated/cldr.locale/week-data.js'

export {type WeekInfoInternal}

export function getCalendarPreferenceDataForRegion(region?: string): string[] {
  const _region = region ? region.toUpperCase() : null

  return (calendars[(_region || '') as CalendarsKey] || calendars['001']).map(
    c => {
      // Resolve aliases
      // cldr-json/cldr-code v42.0.0-ALPHA3-2
      // https://github.com/unicode-org/cldr-json/blob/42.0.0-ALPHA3-2/cldr-json/cldr-bcp47/bcp47/calendar.json
      if (c === 'gregorian') {
        return 'gregory'
      }

      if (c === 'islamic-civil') {
        return 'islamicc'
      }

      // At the time this has been written this calendar was not listed in
      // the supplemental calendarPreferenceData file
      // https://github.com/unicode-org/cldr-json/blob/42.0.0-ALPHA3-2/cldr-json/cldr-core/supplemental/calendarPreferenceData.json
      // if (c === 'ethiopic-amete-alem') {
      //   return 'ethioaa'
      // }

      return c
    }
  ) as string[]
}

export function getHourCyclesPreferenceDataForLocaleOrRegion(
  locale: string,
  region?: string
): string[] {
  const _locale = locale.toLowerCase() as HourCyclesKey
  const _region = (region ? region.toUpperCase() : '') as HourCyclesKey

  const hourCyclesPreference =
    hourCycles[_locale] ||
    hourCycles[_region] ||
    hourCycles[`${_locale}-001` as HourCyclesKey] ||
    hourCycles['001']

  return [...hourCyclesPreference] as string[]
}

export function getTimeZonePreferenceForRegion(region: string): string[] {
  const territory = region.toLowerCase() as TimezonesTerritory

  if (timezones[territory]) {
    return [...timezones[territory]] as string[]
  }

  return []
}

export function getWeekDataForRegion(
  region?: string,
  regionOverride?: string
): WeekInfoInternal {
  const _region = (region ? region.toUpperCase() : '') as WeekDataKey

  // Available region override data takes precedence over the locale's region.
  // ECMA-402 §15.5.17 WeekInfoOfLocale, steps 4–7, Table 27.
  // https://tc39.es/ecma402/#sec-weekinfooflocale
  // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/locale.html#L880-L886
  const override = (regionOverride || '').toUpperCase() as WeekDataKey
  return weekData[override] || weekData[_region] || weekData['001']
}
