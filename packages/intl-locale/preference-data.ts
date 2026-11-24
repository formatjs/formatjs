import {HasOwnProperty} from '#packages/ecma262-abstract/HasOwnProperty.js'
import {
  arrayIndexOf,
  setDataProperty,
} from '#packages/ecma262-abstract/intrinsics.js'
import {timezones} from '@formatjs_generated/cldr.locale/timezones.js'
import {hourCycles} from '@formatjs_generated/cldr.locale/hour-cycles.js'
import {calendars} from '@formatjs_generated/cldr.locale/calendars.js'
import {weekData} from '@formatjs_generated/cldr.locale/week-data.js'

import type {WeekInfoInternal} from '@formatjs_generated/cldr.locale/week-data.js'

export {type WeekInfoInternal}

const apply = Reflect.apply
const upperCase = String.prototype.toUpperCase
const lowerCase = String.prototype.toLowerCase
const sort = Array.prototype.sort

function ownEntry<T>(
  data: Readonly<Record<string, T>>,
  key: string
): T | undefined {
  return HasOwnProperty(data, key) ? data[key] : undefined
}

// Calendar and hour-cycle preference try each preferred region in order,
// with language-region data ahead of region data.
function regionalPreferences(
  data: Readonly<Record<string, readonly string[]>>,
  language: string | undefined,
  region: string | undefined,
  regionOverride: string | undefined
): readonly string[] | undefined {
  const regions = [regionOverride, region]
  for (let index = 0; index < regions.length; index++) {
    const candidate = regions[index]
    if (!candidate) continue
    const territory = apply(upperCase, candidate, [])
    const local = ownEntry(data, `${language}-${territory}`)
    if (local?.length) return local
    const regional = ownEntry(data, territory)
    if (regional?.length) return regional
  }
}

// ECMA-402 §15.5.9 steps 2–6 select calendar preference data.
// https://tc39.es/ecma402/#sec-calendarsoflocale
export function getCalendarPreferenceDataForRegion(
  region?: string,
  regionOverride?: string,
  language?: string
): readonly string[] {
  return regionalPreferences(calendars, language, region, regionOverride) ?? []
}

// ECMA-402 §15.5.11 steps 2–8 select hour-cycle preferences or h23.
// https://tc39.es/ecma402/#sec-hourcyclesoflocale
export function getHourCyclesPreferenceDataForLocaleOrRegion(
  language: string,
  region?: string,
  regionOverride?: string
): string[] {
  const values = regionalPreferences(
    hourCycles,
    language,
    region,
    regionOverride
  )
  if (!values) return ['h23']
  const result: string[] = []
  for (let index = 0; index < values.length; index++)
    setDataProperty(result, index, values[index])
  return result
}

// ECMA-402 §15.5.13 steps 3–4 return fresh, sorted, unique time zones.
// https://tc39.es/ecma402/#sec-timezonesoflocale
export function getTimeZonePreferenceForRegion(region: string): string[] {
  const values = ownEntry(timezones, apply(lowerCase, region, [])) as
    | readonly string[]
    | undefined
  const result: string[] = []
  if (values) {
    for (let index = 0; index < values.length; index++) {
      const zone = values[index]
      if (arrayIndexOf(result, zone) === -1)
        setDataProperty(result, result.length, zone)
    }
  }
  apply(sort, result, [])
  return result
}

// ECMA-402 §15.5.17 steps 4–7 prefer override and region data, then world data.
// https://tc39.es/ecma402/#sec-weekinfooflocale
export function getWeekDataForRegion(
  region?: string,
  regionOverride?: string
): WeekInfoInternal {
  const override = apply(upperCase, regionOverride ?? '', [])
  const territory = apply(upperCase, region ?? '', [])
  return (
    ownEntry(weekData, override) ??
    ownEntry(weekData, territory) ??
    weekData['001']
  )
}
