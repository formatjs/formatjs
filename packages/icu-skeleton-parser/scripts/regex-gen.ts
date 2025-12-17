import {outputFileSync} from 'fs-extra/esm'
import minimist from 'minimist'
import regenerate from 'regenerate'
import './global'

function main(args: minimist.ParsedArgs) {
  const set = regenerate().add(
    require('@unicode/unicode-13.0.0/Binary_Property/Pattern_White_Space/code-points.js')
  )
  outputFileSync(
    args.out,
    `// @generated from regex-gen.ts
export const WHITE_SPACE_REGEX: RegExp = /${set.toString()}/i`
  )
}

if (require.main === module) {
  main(minimist(process.argv))
}
