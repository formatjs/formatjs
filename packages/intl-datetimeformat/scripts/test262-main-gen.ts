import {outputFileSync, readFileSync} from 'fs-extra'
import minimist from 'minimist'

interface Args extends minimist.ParsedArgs {
  cldrFile: string[]
  localesToGen: string[]
  out: string
}

function main(args: Args) {
  const {cldrFile: cldrFiles, out} = args
  cldrFiles.sort()

  // Aggregate all into ../test262-main.js
  const allData = cldrFiles.map(f => readFileSync(f))
  outputFileSync(
    out,
    `/* @generated */
// @ts-nocheck
import './polyfill-force'
import allData from './src/data/all-tz'
defineProperty(Intl, 'DateTimeFormat', {value: DateTimeFormat})
Intl.DateTimeFormat.__addLocaleData(${allData.join(',\n')})
Intl.DateTimeFormat.__addTZData(allData)`
  )
}

if (require.main === module) {
  main(minimist<Args>(process.argv))
}
