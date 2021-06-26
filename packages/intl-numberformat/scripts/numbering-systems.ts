import minimist from 'minimist'
import {outputFileSync} from 'fs-extra'
import {extractNumberingSystemNames} from './extract-numbers'
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

if (require.main === module) {
  main(minimist(process.argv))
}
