import {join, basename} from 'path'
import {outputFileSync, readFileSync} from 'fs-extra'
import minimist from 'minimist'
import {sync as globSync} from 'fast-glob'

function main(args: minimist.ParsedArgs) {
  const {cldrFolder, locales: localesToGen = '', out} = args
  const allFiles = globSync(join(cldrFolder, '*.js'))
  allFiles.sort()
  const locales = localesToGen
    ? localesToGen.split(',')
    : allFiles.map(f => basename(f, '.js'))

  // Aggregate all into ../test262-main.js
  const allData = []
  for (const locale of locales) {
    allData.push(readFileSync(join(cldrFolder, `${locale}.js`)))
  }
  outputFileSync(
    out,
    `/* @generated */
// prettier-ignore
// @ts-nocheck
import './polyfill-force'
if (Intl.PluralRules && typeof Intl.PluralRules.__addLocaleData === 'function') {
  Intl.PluralRules.__addLocaleData(${allData.join(',\n')})
}`
  )
}
if (require.main === module) {
  main(minimist(process.argv))
}
