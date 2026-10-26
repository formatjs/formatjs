import {mkdirSync, writeFileSync} from 'node:fs'
import {join} from 'node:path'
import minimist from 'minimist'
import {calendars} from '@formatjs_generated/datetimeformat.calendars/index.js'
import {chinese} from '@formatjs_generated/icu.calendar/chinese.js'
import {dangi} from '@formatjs_generated/icu.calendar/dangi.js'
import {ummAlQura} from '@formatjs_generated/icu.calendar/umm-al-qura.js'
interface Args extends minimist.ParsedArgs {
  outDir: string
}
function main(args: Args) {
  if (!args.outDir) throw new Error('--outDir required')
  mkdirSync(args.outDir, {recursive: true})
  for (const calendar of calendars) {
    const data =
      calendar === 'chinese'
        ? chinese
        : calendar === 'dangi'
          ? dangi
          : calendar === 'islamic-umalqura'
            ? ummAlQura
            : undefined
    writeFileSync(
      join(args.outDir, calendar + '.json'),
      JSON.stringify({calendar, ...(data ? {data} : {})}) + '\n'
    )
  }
}
if (import.meta.filename === process.argv[1])
  main(minimist(process.argv.slice(2)) as Args)
