import {outputFileSync} from 'fs-extra/esm'
import minimist from 'minimist'
import {readFileSync} from 'fs'

interface Args extends minimist.ParsedArgs {
  cldrFile: string | string[]
  out: string
}

function main(args: Args) {
  const {out} = args
  const cldrFiles = ([] as string[]).concat(args.cldrFile || [])
  cldrFiles.sort()

  // Aggregate all into ../test262-main.js
  const allData = cldrFiles.map(f => {
    const data = JSON.stringify(JSON.parse(readFileSync(f, 'utf-8')))
    return `JSON.parse(${JSON.stringify(data)})`
  })
  outputFileSync(
    out,
    `/* @generated */
// @ts-nocheck
import '#packages/intl-datetimeformat/polyfill-force.js'
import allData from '@formatjs_generated/tz/all-tz.js'
Intl.DateTimeFormat.__addLocaleData(${allData.join(',\n')})
Intl.DateTimeFormat.__addTZData(allData)`
  )
}

if (import.meta.filename === process.argv[1]) {
  main(minimist<Args>(process.argv.slice(2)))
}
