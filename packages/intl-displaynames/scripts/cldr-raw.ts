import {extractDisplayNames, getAllLocales} from './extract-displaynames'
import {join} from 'path'
import {writeFileSync} from 'fs-extra'
import stringify from 'json-stable-stringify'

import minimist from 'minimist'

async function main(args: minimist.ParsedArgs) {
  const {outDir} = args
  const locales = await getAllLocales()
  const data = await extractDisplayNames(locales)
  locales.forEach(locale =>
    writeFileSync(
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
