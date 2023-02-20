import {timezones} from './timezones.generated'
import {hourCycles} from './hour-cycles.generated'
import {calendars} from './calendars.generated'
import {weekData} from './week-data.generated'

import type {TimezonesTerritory} from './timezones.generated'
import type {HourCyclesKey} from './hour-cycles.generated'
import type {CalendarsKey} from './calendars.generated'
import type {WeekDataKey, WeekInfoInternal} from './week-data.generated'

export {WeekInfoInternal}

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

export function getWeekDataForRegion(region?: string): WeekInfoInternal {
  const _region = (region ? region.toUpperCase() : '') as WeekDataKey

  return weekData[_region || '001'] || weekData['001']
}
