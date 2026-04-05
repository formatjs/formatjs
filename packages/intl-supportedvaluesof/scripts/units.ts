import minimist from 'minimist'
import {outputFileSync} from 'fs-extra/esm'
import {SIMPLE_UNITS} from '#packages/ecma402-abstract/IsSanctionedSimpleUnitIdentifier.js'

interface Args extends minimist.ParsedArgs {
  zone: string[]
}

function main(args: Args) {
  const {out} = args

  outputFileSync(
    out,
    `/* @generated */
// prettier-ignore
export const units = ${JSON.stringify(SIMPLE_UNITS)} as const
export type Unit = typeof units[number]`
  )
}

if (import.meta.filename === process.argv[1]) {
  main(minimist<Args>(process.argv))
}
