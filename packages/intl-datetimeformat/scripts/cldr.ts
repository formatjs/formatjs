import {basename} from 'path'
import {emitLocaleData} from './emit-locale-data.ts'
import minimist from 'minimist'
import {readFileSync} from 'fs'

interface Args extends minimist.ParsedArgs {
  cldrFile: string | string[]
  outDir: string
}
function main(args: Args) {
  const {outDir} = args
  const cldrFiles = ([] as string[]).concat(args.cldrFile || [])
  cldrFiles.sort()
  cldrFiles.forEach(cldrFile => {
    const locale = basename(cldrFile, '.json')
    const raw = JSON.parse(readFileSync(cldrFile, 'utf8'))
    const {calendarData: _calendars, formats, ...data} = raw.data
    emitLocaleData(
      outDir,
      locale,
      {
        ...raw,
        data: {
          ...data,
          formats: {gregory: formats.gregory, iso8601: formats.iso8601},
        },
      },
      '__addLocaleData',
      '__FORMATJS_DATETIMEFORMAT_DATA__'
    )
  })
}
if (import.meta.filename === process.argv[1]) {
  main(minimist<Args>(process.argv.slice(2)))
}
