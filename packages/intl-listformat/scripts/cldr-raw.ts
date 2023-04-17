import {extractLists, getAllLocales} from './extract-list'
import {join} from 'path'
import {outputFileSync} from 'fs-extra'
import stringify from 'json-stable-stringify'

import minimist from 'minimist'

async function main(args: minimist.ParsedArgs) {
  const {outDir} = args
  const locales = await getAllLocales()
  const data = await extractLists(locales)
  locales.forEach(locale =>
    outputFileSync(
      join(outDir, `${locale}.json`),
      stringify(
        {
          data: data[locale],
          locale,
        },
        {space: 2}
      )
    )
  )
}

if (require.main === module) {
  ;(async () => main(minimist(process.argv)))()
}
