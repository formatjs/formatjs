import * as rawMetaZones from 'cldr-core/supplemental/metaZones.json'
import * as rawTimeData from 'cldr-core/supplemental/timeData.json'
import * as rawCalendarPreferenceData from 'cldr-core/supplemental/calendarPreferenceData.json'
import * as rawWeekData from 'cldr-core/supplemental/weekData.json'

export type WeekInfoInternal = {
  firstDay: number
  weekend: number[]
  minimalDays: number
}

const {calendarPreferenceData} = rawCalendarPreferenceData.supplemental
const {metaZones} = rawMetaZones.supplemental
const {timeData} = rawTimeData.supplemental
const {weekData} = rawWeekData.supplemental

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

function resolveWeekDaySymbolTable(token: string): number {
  switch (token) {
    case 'mon':
      return 1
    case 'tue':
      return 2
    case 'wed':
      return 3
    case 'thu':
      return 4
    case 'fri':
      return 5
    case 'sat':
      return 6
    case 'sun':
      return 7
  }
  return 0
}

const processedHourCycles = Object.keys(timeData).reduce(
  (all: Record<string, string[]>, k) => {
    all[k.replace('_', '-')] =
      timeData[k as keyof typeof timeData]
        ._allowed
        .split(' ')
        .map(resolveDateTimeSymbolTable)
        .filter(Boolean)
    return all
  },
  {}
)

const territoryToMapZonesMap = metaZones.metazones.reduce(
  (all: Record<string, string[]>, z) => {
    if (all[z.mapZone._territory]) {
      all[z.mapZone._territory].push(z.mapZone._type)
    } else {
      all[z.mapZone._territory] = [z.mapZone._type]
    }
    return all
  },
  {}
)

export function getCalendarPreferenceDataForRegion(region?: string): string[] {
  return (
    calendarPreferenceData[(region || '') as keyof typeof calendarPreferenceData] ||
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
  })
}

export function getHourCyclesPreferenceDataForLocaleOrRegion(locale: string, region?: string): string[] {
  return (
    processedHourCycles[locale] ||
    processedHourCycles[region || ''] ||
    processedHourCycles[`${locale}-001`] ||
    processedHourCycles['001']
  )
}

export function getTimeZonePreferenceForRegion(region: string): string[] {
  return territoryToMapZonesMap[region as keyof typeof territoryToMapZonesMap] || []
}

export function getWeekDataForRegion(region?: string): WeekInfoInternal {
  const r = region || ''

  const weekendStart = weekData.weekendStart[r as keyof typeof weekData.weekendStart] || weekData.weekendStart['001']
  const weekendEnd = weekData.weekendEnd[r as keyof typeof weekData.weekendEnd] || weekData.weekendEnd['001']
  const minDays = weekData.minDays[r as keyof typeof weekData.minDays] || weekData.minDays['001']
  const firstDay = weekData.firstDay[r as keyof typeof weekData.firstDay] || weekData.firstDay['001']

  const weekend = [resolveWeekDaySymbolTable(weekendStart)]
  const weekendFinalDay = resolveWeekDaySymbolTable(weekendEnd)

  let currentWeekendDay = weekend[0]
  while (weekendFinalDay && weekendFinalDay !== currentWeekendDay) {
    currentWeekendDay = (currentWeekendDay + 1) % 8 || 1
    weekend.push(currentWeekendDay)
  }

  return {
    minimalDays: Number.parseInt(minDays, 10),
    firstDay: resolveWeekDaySymbolTable(firstDay),
    weekend,
  }
}
