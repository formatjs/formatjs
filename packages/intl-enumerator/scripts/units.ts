import minimist from 'minimist'
import {outputFileSync} from 'fs-extra'
import {SIMPLE_UNITS} from '@formatjs/ecma402-abstract'

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

if (require.main === module) {
  main(minimist<Args>(process.argv))
}
