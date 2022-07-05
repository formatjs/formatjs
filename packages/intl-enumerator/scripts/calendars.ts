import minimist from 'minimist'
import {outputFileSync} from 'fs-extra'
import {keyword} from 'cldr-bcp47/bcp47/calendar.json'
function main(args: minimist.ParsedArgs) {
  const {out} = args
  const calendars = Object.keys(keyword.u.ca).filter(k => !k.startsWith('_'))

  // Output numbering systems file
  outputFileSync(
    out,
    `export const calendars = ${JSON.stringify(calendars)} as const
export type Calendar = typeof calendars[number]
    `
  )
}

if (require.main === module) {
  main(minimist(process.argv))
}
