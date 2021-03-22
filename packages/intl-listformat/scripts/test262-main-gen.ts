import {join, basename} from 'path'
import {outputFileSync, readFileSync} from 'fs-extra'
import {sync as globSync} from 'fast-glob'
import minimist from 'minimist'

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
if (Intl.ListFormat && typeof Intl.ListFormat.__addLocaleData === 'function') {
  Intl.ListFormat.__addLocaleData(${allData.join(',\n')})
}`
  )
}

if (require.main === module) {
  main(minimist(process.argv))
}
