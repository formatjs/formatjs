import minimist from 'minimist'
import {outputFileSync} from 'fs-extra'
import {keyword} from 'cldr-bcp47/bcp47/collation.json'
function main(args: minimist.ParsedArgs) {
  const {out} = args
  const collations = Object.keys(keyword.u.co).filter(k => !k.startsWith('_'))

  // Output numbering systems file
  outputFileSync(
    out,
    `/* @generated */
// prettier-ignore
export const collations = ${JSON.stringify(collations)} as const
export type Collation = typeof collations[number]
    `
  )
}

if (require.main === module) {
  main(minimist(process.argv))
}
