import {outputFileSync, readFileSync} from 'fs-extra'
import minimist from 'minimist'

interface Args extends minimist.ParsedArgs {
  cldrFile: string[]
}

function main(args: Args) {
  const {cldrFile: cldrFiles, out} = args
  cldrFiles.sort()

  // Aggregate all into ../test262-main.js
  const allData = cldrFiles.map(f => readFileSync(f))
  outputFileSync(
    out,
    `/* @generated */
// prettier-ignore
// @ts-nocheck
import './polyfill-force'
if (Intl.PluralRules && typeof Intl.PluralRules.__addLocaleData === 'function') {
  Intl.PluralRules.__addLocaleData(${allData.join(',\n')})
}
`
  )
}
if (require.main === module) {
  main(minimist<Args>(process.argv))
}
