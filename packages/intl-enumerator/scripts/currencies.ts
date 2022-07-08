import minimist from 'minimist'
import {outputFileSync} from 'fs-extra'
import {main as data} from 'cldr-numbers-full/main/en/currencies.json'
function main(args: minimist.ParsedArgs) {
  const {out} = args
  const currencies = Object.keys(data.en.numbers.currencies)

  // Output numbering systems file
  outputFileSync(
    out,
    `/* @generated */
// prettier-ignore
export const currencies = ${JSON.stringify(currencies)} as const
export type Currency = typeof currencies[number]
    `
  )
}

if (require.main === module) {
  main(minimist(process.argv))
}
