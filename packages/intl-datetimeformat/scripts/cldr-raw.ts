import {extractDatesFields, getAllLocales} from './extract-dates.ts'
import {join} from 'path'
import {outputJSONSync} from 'fs-extra/esm'

import minimist from 'minimist'
import {isoPatternSource} from './iso-patterns.ts'

interface Args extends minimist.ParsedArgs {
  outDir: string
  calendarXmlDir: string
}

async function main(args: Args) {
  const {outDir} = args
  const isoPatterns = isoPatternSource(args.calendarXmlDir)
  // Release each locale's expanded patterns before generating the next locale.
  for (const locale of getAllLocales()) {
    const data = await extractDatesFields([locale], isoPatterns)
    outputJSONSync(
      join(outDir, `${locale}.json`),
      {
        data: data[locale],
        locale,
      },
      {spaces: 2}
    )
  }
}
if (import.meta.filename === process.argv[1]) {
  await main(minimist<Args>(process.argv.slice(2)))
}
