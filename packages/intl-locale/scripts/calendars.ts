import minimist from 'minimist'
import {outputFileSync} from 'fs-extra/esm'

import rawCalendarPreferenceData from 'cldr-core/supplemental/calendarPreferenceData.json' with {type: 'json'}

import type {Args} from './common-types.ts'
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

if (import.meta.filename === process.argv[1]) {
  main(minimist<Args>(process.argv))
}
