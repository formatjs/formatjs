import {outputFileSync} from 'fs-extra/esm'
import minimist from 'minimist'
import {readFileSync} from 'fs'
interface Args extends minimist.ParsedArgs {
  cldrFile: string[]
  localesToGen: string[]
  out: string
}

function main(args: Args) {
  const {cldrFile: cldrFiles, out} = args
  cldrFiles.sort()

  // Aggregate all into ../test262-main.js
  const allData = cldrFiles.map(f => readFileSync(f, 'utf-8'))
  outputFileSync(
    out,
    `// @generated
// @ts-nocheck
import './polyfill-force.js';
if (Intl.DisplayNames && typeof Intl.DisplayNames.__addLocaleData === 'function') {
  Intl.DisplayNames.__addLocaleData(${allData.join(',\n')})
}`
  )
}

if (import.meta.filename === process.argv[1]) {
  main(minimist<Args>(process.argv))
}
