import {generateDataForLocales as extractCurrencies} from './extract-currencies.ts'
import {generateDataForLocales as extractUnits} from './extract-units.ts'
import {generateDataForLocales as extractNumbers} from './extract-numbers.ts'
import {createRequire} from 'node:module'
import {dirname, join, resolve} from 'path'
import glob from 'fast-glob'
import {outputFileSync} from 'fs-extra/esm'
import stringify from 'json-stable-stringify'
import minimist from 'minimist'

const globSync = glob.sync
const require = createRequire(import.meta.url)

function getAllLocales(): string[] {
  return globSync('*/numbers.json', {
    cwd: resolve(
      dirname(require.resolve('cldr-numbers-full/package.json')),
      './main'
    ),
  })
    .map(dirname)
    .filter(l => {
      try {
        return (Intl as any).getCanonicalLocales(l).length
      } catch {
        console.warn(`Invalid locale ${l}`)
        return false
      }
    })
}

async function main(args: minimist.ParsedArgs) {
  const {outDir} = args
  // Dist all locale files to locale-data
  const locales = getAllLocales()
  const [numbersData, currenciesData, unitsData] = await Promise.all([
    extractNumbers(locales),
    extractCurrencies(locales),
    extractUnits(locales),
  ])

  for (let locale of locales) {
    const d = {
      units: unitsData[locale],
      currencies: currenciesData[locale],
      numbers: numbersData[locale],
      nu: numbersData[locale].nu,
    }
    outputFileSync(
      join(outDir, `${locale}.json`),
      stringify(
        {
          data: d,
          locale,
        },
        {space: 2}
      )
    )
  }
}

if (import.meta.filename === process.argv[1]) {
  ;(async () => main(minimist(process.argv)))()
}
