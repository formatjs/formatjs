import {join, basename} from 'path'
import {outputFileSync, readFileSync} from 'fs-extra'
import minimist from 'minimist'
import {sync as globSync} from 'fast-glob'

function main(args: minimist.ParsedArgs) {
  const {cldrFolder, locales: localesToGen = '', out} = args
  const allFiles = globSync(join(cldrFolder, '*.json'))
  allFiles.sort()
  const locales = localesToGen
    ? localesToGen.split(',')
    : allFiles.map(f => basename(f, '.json'))

  const allData = []
  for (const locale of locales) {
    allData.push(readFileSync(join(cldrFolder, `${locale}.json`)))
  }
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
  main(minimist(process.argv))
}
