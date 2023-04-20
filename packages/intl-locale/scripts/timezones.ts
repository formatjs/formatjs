import minimist from 'minimist'
import {outputFileSync} from 'fs-extra'
import stringify from 'json-stable-stringify'
import * as rawTimezones from 'cldr-bcp47/bcp47/timezone.json'

import type {Args} from './common-types'

type Tz = typeof rawTimezones.keyword.u.tz & {
  _alias: never
  _description: never
}
type TzEntry = {
  _alias?: string
  _description: string
  _preferred?: string
  _deprecated?: boolean
}

const tz = rawTimezones.keyword.u.tz as Tz

function getTimezoneAlias(timezone: TzEntry): string | null {
  let val: string | null

  if (timezone._preferred) {
    const preferredZone = timezone._preferred as keyof Tz
    val = getTimezoneAlias(tz[preferredZone])
  } else if (timezone._alias) {
    val = timezone._alias.split(' ')[0]
  } else {
    val = null
  }

  return val
}

const territoryToTimezonesMap = Object.keys(tz).reduce(
  (all: Record<string, string[]>, zone: string) => {
    const territory = zone.slice(0, 2) as string

    const timezone = tz[zone as keyof typeof tz]
    const val = getTimezoneAlias(timezone)

    if (!val) {
      return all
    }

    if (all[territory]) {
      all[territory].push(val)
    } else {
      all[territory] = [val]
    }

    return all
  },
  {}
)

const territories = Object.keys(territoryToTimezonesMap)

for (const territory of territories) {
  territoryToTimezonesMap[territory] = territoryToTimezonesMap[
    territory
  ].reduce((all: string[], timezone: string) => {
    if (!(timezone in all)) {
      all.push(timezone)
    }

    return all
  }, [])
}

async function main(args: Args) {
  const {out} = args

  outputFileSync(
    out,
    `/* @generated */
// prettier-ignore
export const timezones = ${stringify(territoryToTimezonesMap, {
      space: 2,
    })} as const
export type TimezonesTerritory = keyof typeof timezones`
  )
}

if (require.main === module) {
  main(minimist<Args>(process.argv))
}
