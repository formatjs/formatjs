import {supplemental} from 'cldr-core/supplemental/currencyData.json'
import {outputJsonSync} from 'fs-extra/esm'
import minimist from 'minimist'

interface Args {
  out: string
}

function main(args: Args) {
  const {
    currencyData: {region},
  } = supplemental
  console.log(args)
  outputJsonSync(
    args.out,
    Object.keys(region).reduce<Record<string, string>>((all, k) => {
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
  )
}

if (require.main === module) {
  main(minimist<Args>(process.argv))
}
