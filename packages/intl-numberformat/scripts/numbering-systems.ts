import minimist from 'minimist'
import {outputFileSync} from 'fs-extra/esm'
import {extractNumberingSystemNames} from './extract-numbers.ts'
function main(args: minimist.ParsedArgs) {
  const {out} = args

  // Output numbering systems file
  outputFileSync(
    out,
    `export const numberingSystemNames: ReadonlyArray<string> = ${JSON.stringify(
      extractNumberingSystemNames().names
    )};`
  )
}

if (import.meta.filename === process.argv[1]) {
  main(minimist(process.argv))
}
