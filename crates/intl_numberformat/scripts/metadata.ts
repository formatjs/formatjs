import {writeFileSync} from 'node:fs'
import minimist from 'minimist'
import {currencyDigitsData} from '@formatjs_generated/cldr.number/currency-digits.js'
import {digitMapping} from '@formatjs_generated/unicode/digit-mapping.js'
import {SIMPLE_UNITS} from '#packages/ecma402-abstract/IsSanctionedSimpleUnitIdentifier.js'

interface Args extends minimist.ParsedArgs {
  out: string
}
function main(args: Args) {
  if (!args.out) throw new Error('--out required')
  writeFileSync(
    args.out,
    JSON.stringify({
      currencyDigits: currencyDigitsData,
      digits: digitMapping,
      units: SIMPLE_UNITS,
    }) + '\n'
  )
}
if (import.meta.filename === process.argv[1])
  main(minimist(process.argv.slice(2)) as Args)
