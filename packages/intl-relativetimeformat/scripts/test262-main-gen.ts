import {outputFileSync, } from 'fs-extra/esm'
import minimist from 'minimist'

import {readFileSync} from 'fs'
interface Args extends minimist.ParsedArgs {
  cldrFile: string[]
}

function main(args: Args) {
  const {cldrFile: cldrFiles, out} = args
  cldrFiles.sort()

  // Aggregate all into ../test262-main.js
  const allData = cldrFiles.map(f => readFileSync(f, 'utf8'))
  outputFileSync(
    out,
    `/* @generated */
// prettier-ignore
// @ts-nocheck
import './polyfill-force.js'
if (Intl.RelativeTimeFormat && typeof Intl.RelativeTimeFormat.__addLocaleData === 'function') {
  Intl.RelativeTimeFormat.__addLocaleData(${allData.join(',\n')})
}
`
  )
}
main(minimist<Args>(process.argv))
