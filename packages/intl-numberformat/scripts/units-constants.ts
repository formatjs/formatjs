import minimist from 'minimist'
import {SIMPLE_UNITS} from '@formatjs/ecma402-abstract'
import {outputFileSync} from 'fs-extra/esm'

function main(args: minimist.ParsedArgs) {
  const {out} = args

  outputFileSync(
    out,
    `/* @generated */
  // prettier-ignore
  export type Unit =
    ${SIMPLE_UNITS.map(u => `'${u}'`).join(' | ')}
  `
  )
}

if (import.meta.filename === process.argv[1]) {
  main(minimist(process.argv))
}
