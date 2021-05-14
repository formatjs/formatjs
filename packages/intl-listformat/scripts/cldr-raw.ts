import {extractLists, getAllLocales} from './extract-list'
import {join} from 'path'
import {outputJSONSync} from 'fs-extra'

import minimist from 'minimist'

async function main(args: minimist.ParsedArgs) {
  const {outDir} = args
  const locales = await getAllLocales()
  const data = await extractLists(locales)
  locales.forEach(locale =>
    outputJSONSync(join(outDir, `${locale}.json`), {
      data: data[locale],
      locale,
    })
  )
}

if (require.main === module) {
  ;(async () => main(minimist(process.argv)))()
}
