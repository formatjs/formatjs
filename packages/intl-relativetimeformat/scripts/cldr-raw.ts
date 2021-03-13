import {extractRelativeFields, getAllLocales} from './extract-relative'
import {join} from 'path'
import {outputJSONSync} from 'fs-extra'

import minimist from 'minimist'

async function main(args: minimist.ParsedArgs) {
  const {outDir} = args
  const locales = await getAllLocales()
  const data = await extractRelativeFields(locales)
  for (let locale of locales) {
    const d = data[locale]
    if (locale === 'en-US-POSIX') {
      locale = 'en-US'
    }
    outputJSONSync(join(outDir, `${locale}.json`), {
      data: d,
      locale,
    })
  }
}

if (require.main === module) {
  ;(async () => main(minimist(process.argv)))()
}
