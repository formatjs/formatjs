import minimist from 'minimist'
import {outputFileSync} from 'fs-extra'

import * as rawCalendarPreferenceData from 'cldr-core/supplemental/calendarPreferenceData.json'

import type {Args} from './common-types'
import stringify from 'json-stable-stringify'

const {calendarPreferenceData} = rawCalendarPreferenceData.supplemental

async function main(args: Args) {
  const {out} = args

  outputFileSync(
    out,
    `/* @generated */
// prettier-ignore
export const calendars = ${stringify(calendarPreferenceData, {
      space: 2,
    })} as const
export type CalendarsKey = keyof typeof calendars`
  )
}

if (require.main === module) {
  main(minimist<Args>(process.argv))
}
