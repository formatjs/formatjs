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
    `// @generated
// @ts-nocheck
import '@formatjs/intl-getcanonicallocales/polyfill'
import '@formatjs/intl-locale/polyfill'
import '@formatjs/intl-enumerator/polyfill'

import '@formatjs/intl-listformat/polyfill-force'
import '@formatjs/intl-numberformat/polyfill-force'

import '@formatjs/intl-numberformat/locale-data/en'
import '@formatjs/intl-listformat/locale-data/en'

import './polyfill-force';
if (Intl.DurationFormat && typeof Intl.DurationFormat.__addLocaleData === 'function') {
  Intl.DurationFormat.__addLocaleData(${allData.join(',\n')})
}`
  )
}

if (require.main === module) {
  main(minimist<Args>(process.argv))
}
