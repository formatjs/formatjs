import minimist from 'minimist'
import {outputFileSync} from 'fs-extra'

import * as rawCalendarPreferenceData from 'cldr-core/supplemental/calendarPreferenceData.json'

import type {Args} from './common-types'

const {calendarPreferenceData} = rawCalendarPreferenceData.supplemental

async function main(args: Args) {
  const {out} = args

  outputFileSync(
    out,
    `/* @generated */
// prettier-ignore
export const calendars = ${JSON.stringify(calendarPreferenceData)} as const
export type CalendarsKey = keyof typeof calendars`
  )
}

if (require.main === module) {
  main(minimist<Args>(process.argv))
}
