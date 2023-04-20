import minimist from 'minimist'
import {outputFileSync} from 'fs-extra'
import stringify from 'json-stable-stringify'
import * as rawTimeData from 'cldr-core/supplemental/timeData.json'

import type {Args} from './common-types'

const {timeData} = rawTimeData.supplemental

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

const processedHourCycles = Object.keys(timeData).reduce(
  (all: Record<string, string[]>, k) => {
    all[k.replace('_', '-')] = timeData[k as keyof typeof timeData]._allowed
      .split(' ')
      .map(resolveDateTimeSymbolTable)
      .filter(Boolean)
    return all
  },
  {}
)

async function main(args: Args) {
  const {out} = args

  outputFileSync(
    out,
    `/* @generated */
// prettier-ignore
export const hourCycles = ${stringify(processedHourCycles, {space: 2})} as const
export type HourCyclesKey = keyof typeof hourCycles`
  )
}

if (require.main === module) {
  main(minimist<Args>(process.argv))
}
