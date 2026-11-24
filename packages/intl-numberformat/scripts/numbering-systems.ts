import minimist from 'minimist'
import {outputFileSync} from 'fs-extra/esm'
import {extractNumberingSystemNames} from './extract-numbers.ts'
async function main(args: minimist.ParsedArgs) {
  const {out} = args
  const {names, numeric, candidates} = await extractNumberingSystemNames()

  // Output numbering systems file
  outputFileSync(
    out,
    `export const numberingSystemNames: ReadonlyArray<string> = ${JSON.stringify(names)};
export const numericNumberingSystemNames: ReadonlyArray<string> = ${JSON.stringify(numeric)};
export const numberingSystemCandidateLocales: Readonly<Record<string, readonly string[]>> = ${JSON.stringify(candidates)};`
  )
}

if (import.meta.filename === process.argv[1]) {
  await main(minimist(process.argv))
}
