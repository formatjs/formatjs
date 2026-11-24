import minimist from 'minimist'
import {outputFileSync} from 'fs-extra/esm'
import calendarData from 'cldr-bcp47/bcp47/calendar.json' with {type: 'json'}
const {keyword} = calendarData
function main(args: minimist.ParsedArgs) {
  const {out} = args
  const types = keyword.u.ca as Record<string, {_preferred?: string}>
  // ECMA-402 §8.3.2 step 2.b excludes calendar aliases.
  // https://tc39.es/ecma402/#sec-intl.supportedvaluesof
  const calendars = Object.keys(types).filter(
    key => !key.startsWith('_') && !types[key]._preferred
  )

  outputFileSync(
    out,
    `/* @generated */
// prettier-ignore
export const calendars = ${JSON.stringify(calendars)} as const
export type Calendar = typeof calendars[number]
    `
  )
}

if (import.meta.filename === process.argv[1]) {
  main(minimist(process.argv))
}
