import {supplemental} from 'cldr-core/supplemental/currencyData.json'
import {outputJsonSync} from 'fs-extra'
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
      const defaultCurrencyData =
        region[k as 'US'][region[k as 'US'].length - 1]
      all[k] = Object.keys(defaultCurrencyData)[0]
      return all
    }, {})
  )
}

if (require.main === module) {
  main(minimist<Args>(process.argv))
}
