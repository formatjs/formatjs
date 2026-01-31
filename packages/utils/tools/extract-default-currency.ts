import currencyData from 'cldr-core/supplemental/currencyData.json' with {type: 'json'}
const {supplemental} = currencyData
import {outputFileSync} from 'fs-extra/esm'
import minimist from 'minimist'

interface Args {
  out: string
}

function main(args: Args) {
  const {
    currencyData: {region},
  } = supplemental
  const data = Object.keys(region).reduce<Record<string, string>>((all, k) => {
    const currencyList = region[k as 'US'].filter(
      regionObj =>
        regionObj &&
        Object.values(regionObj).every(c => '_from' in c && !('_to' in c))
    )
    const defaultCurrencyData = currencyList[currencyList.length - 1]
    if (defaultCurrencyData) {
      all[k] = Object.keys(defaultCurrencyData)[0]
    }
    return all
  }, {})
  outputFileSync(
    args.out,
    `
      // This is a generated file. Do not edit directly.
      export default ${JSON.stringify(data, null, 2)} as const;`
  )
}

if (import.meta.filename === process.argv[1]) {
  main(minimist<Args>(process.argv))
}
