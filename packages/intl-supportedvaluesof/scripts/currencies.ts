import minimist from 'minimist'
import {outputFileSync} from 'fs-extra/esm'
import currenciesData from 'cldr-numbers-full/main/en/currencies.json' with {type: 'json'}
const {main: data} = currenciesData
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

if (import.meta.filename === process.argv[1]) {
  main(minimist(process.argv))
}
