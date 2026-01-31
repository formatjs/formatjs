import minimist from 'minimist'
import {outputFileSync} from 'fs-extra/esm'
import calendarData from 'cldr-bcp47/bcp47/calendar.json' with {type: 'json'}
const {keyword} = calendarData
function main(args: minimist.ParsedArgs) {
  const {out} = args
  const calendars = Object.keys(keyword.u.ca).filter(k => !k.startsWith('_'))

  // Output numbering systems file
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
