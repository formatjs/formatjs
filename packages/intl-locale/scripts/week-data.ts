import minimist from 'minimist'
import {outputFileSync} from 'fs-extra'

import * as rawWeekData from 'cldr-core/supplemental/weekData.json'
import * as rawTerritoryInfo from 'cldr-core/supplemental/territoryInfo.json'

import type {Args} from './common-types'
import stringify from 'json-stable-stringify'

type WeekInfoInternal = {
  firstDay: number
  weekend: number[]
  minimalDays: number
}

const {territoryInfo} = rawTerritoryInfo.supplemental
const allTerritories = Object.keys(territoryInfo)

type WeekDataForTerritories = {
  [key: typeof allTerritories[number]]: WeekInfoInternal
}

const {weekData} = rawWeekData.supplemental

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

export function getWeekDataForRegion(region?: string): WeekInfoInternal {
  const r = region || ''

  const weekendStart =
    weekData.weekendStart[r as keyof typeof weekData.weekendStart] ||
    weekData.weekendStart['001']
  const weekendEnd =
    weekData.weekendEnd[r as keyof typeof weekData.weekendEnd] ||
    weekData.weekendEnd['001']
  const minDays =
    weekData.minDays[r as keyof typeof weekData.minDays] ||
    weekData.minDays['001']
  const firstDay =
    weekData.firstDay[r as keyof typeof weekData.firstDay] ||
    weekData.firstDay['001']

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

const weekDataForTerritories: WeekDataForTerritories = {
  '001': getWeekDataForRegion('001'),
}

for (const territory of allTerritories) {
  weekDataForTerritories[territory] = getWeekDataForRegion(territory as string)
}

async function main(args: Args) {
  const {out} = args

  outputFileSync(
    out,
    `/* @generated */
// prettier-ignore
export const weekData = ${stringify(weekDataForTerritories, {
      space: 2,
    })} as const
export type WeekDataKey = keyof typeof weekData
export type WeekInfoInternal = typeof weekData[WeekDataKey]`
  )
}

if (require.main === module) {
  main(minimist<Args>(process.argv))
}
