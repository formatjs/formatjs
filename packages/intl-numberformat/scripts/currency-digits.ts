import minimist from 'minimist'
import {extractCurrencyDigits} from './extract-currencies'
import {outputFileSync} from 'fs-extra'
import stringify from 'json-stable-stringify'
function main(args: minimist.ParsedArgs) {
  const {out} = args
  // Output currency digits file
  outputFileSync(
    out,
    `export const currencyDigitsData: Record<string, number> = ${stringify(
      extractCurrencyDigits(),
      {space: 2}
    )}`
  )
}

if (require.main === module) {
  main(minimist(process.argv))
}
