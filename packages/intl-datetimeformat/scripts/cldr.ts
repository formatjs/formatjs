import {join, basename} from 'path'
import {outputFileSync} from 'fs-extra/esm'
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
    function emit(path: string, data: unknown, method: string, queue: string) {
      const json = JSON.stringify(data)
      outputFileSync(
        join(outDir, path + '.js'),
        `/* @generated */
(function (data) {
  if (Intl.DateTimeFormat && typeof Intl.DateTimeFormat.${method} === 'function') {
    Intl.DateTimeFormat.${method}(data)
  } else {
    (globalThis.${queue} = globalThis.${queue} || []).push(data)
  }
})(JSON.parse(${JSON.stringify(json)}));
`
      )
      outputFileSync(join(outDir, path + '.d.ts'), 'export {}')
    }
    for (const [calendar, data] of Object.entries(
      raw.data.calendarData || {}
    )) {
      emit(
        `../calendar-data/${calendar}/${locale}`,
        {
          locale,
          calendar,
          data,
          formats: raw.data.formats[calendar],
        },
        '__addCalendarLocaleData',
        '__FORMATJS_DATETIMEFORMAT_CALENDAR_LOCALE_DATA__'
      )
    }
    const {calendarData: _calendars, formats, ...data} = raw.data
    emit(
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
