import {extractDatesFields, getAllLocales} from './extract-dates.ts'
import {join} from 'path'
import {outputJSONSync} from 'fs-extra/esm'

import minimist from 'minimist'

interface Args extends minimist.ParsedArgs {
  outDir: string
}

async function main(args: Args) {
  const {outDir} = args
  // Release each locale's expanded patterns before generating the next locale.
  for (const locale of getAllLocales()) {
    const data = await extractDatesFields([locale])
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
