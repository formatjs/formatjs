import {extractDatesFields, getAllLocales} from './extract-dates.ts'
import {join} from 'path'
import {outputJSONSync} from 'fs-extra/esm'

import minimist from 'minimist'

async function main(args: minimist.ParsedArgs) {
  const {outDir} = args
  const requestedLocales =
    typeof args.locales === 'string'
      ? new Set(args.locales.split(',').filter(Boolean))
      : undefined
  const locales = getAllLocales().filter(
    locale => !requestedLocales || requestedLocales.has(locale)
  )
  const data = await extractDatesFields(locales)
  locales.forEach(locale =>
    outputJSONSync(
      join(outDir, `${locale}.json`),
      {
        data: data[locale],
        locale,
      },
      {spaces: 2}
    )
  )
}
if (import.meta.filename === process.argv[1]) {
  ;(async () => main(minimist(process.argv)))()
}
