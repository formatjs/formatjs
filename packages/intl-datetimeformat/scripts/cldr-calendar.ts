import {basename} from 'path'
import {emitLocaleData} from './emit-locale-data.ts'
import minimist from 'minimist'
import {readFileSync} from 'fs'

interface Args extends minimist.ParsedArgs {
  cldrFile: string | string[]
  outDir: string
  calendar: string
}
function main(args: Args) {
  if (!args.calendar) throw new Error('--calendar is required')
  const cldrFiles = ([] as string[]).concat(args.cldrFile || []).sort()
  for (const cldrFile of cldrFiles) {
    const locale = basename(cldrFile, '.json')
    const raw = JSON.parse(readFileSync(cldrFile, 'utf8'))
    const calendar = args.calendar
    const data = raw.data.calendarData?.[calendar]
    const formats = raw.data.formats[calendar]
    if (!data || !formats)
      throw new Error(`Missing ${calendar} data for ${locale}`)
    emitLocaleData(
      args.outDir,
      locale,
      {locale, calendar, data, formats},
      '__addCalendarLocaleData',
      '__FORMATJS_DATETIMEFORMAT_CALENDAR_LOCALE_DATA__'
    )
  }
}
if (import.meta.filename === process.argv[1]) {
  main(minimist<Args>(process.argv.slice(2)))
}
