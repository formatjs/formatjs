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

export function getCalendarPreferenceDataForRegion(
  region?: string,
  regionOverride?: string,
  language?: string
): string[] {
  // ECMA-402 §15.5.9 CalendarsOfLocale, steps 2–6: try override data first,
  // then the preferred region, checking language-region data before region data.
  // https://tc39.es/ecma402/#sec-calendarsoflocale
  // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/locale.html#L633-L642
  for (const candidate of [regionOverride, region]) {
    if (!candidate) continue
    const territory = candidate.toUpperCase()
    const values =
      calendars[`${language}-${territory}` as CalendarsKey] ||
      calendars[territory as CalendarsKey]
    if (values) {
      // Step 9 canonicalizes calendar types; keep islamic-civil canonical.
      // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/locale.html#L645-L648
      return values.map(c => (c === 'gregorian' ? 'gregory' : c))
    }
  }
  return ['gregory']
}

export function getHourCyclesPreferenceDataForLocaleOrRegion(
  language: string,
  region?: string,
  regionOverride?: string
): string[] {
  // ECMA-402 §15.5.11 HourCyclesOfLocale, steps 2–7.
  // https://tc39.es/ecma402/#sec-hourcyclesoflocale
  // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/locale.html#L692-L702
  for (const candidate of [regionOverride, region]) {
    if (!candidate) continue
    const territory = candidate.toUpperCase()
    const values =
      hourCycles[`${language}-${territory}` as HourCyclesKey] ||
      hourCycles[territory as HourCyclesKey]
    if (values) return [...values]
  }
  return ['h23']
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
