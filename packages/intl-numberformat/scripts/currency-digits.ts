import minimist from 'minimist'
import {extractCurrencyDigits} from './extract-currencies'
import {outputFileSync} from 'fs-extra'

function main(args: minimist.ParsedArgs) {
  const {out} = args
  // Output currency digits file
  outputFileSync(
    out,
    `export const currencyDigitsData: Record<string, number> = ${JSON.stringify(
      extractCurrencyDigits()
    )}`
  )
}

if (require.main === module) {
  main(minimist(process.argv))
}
