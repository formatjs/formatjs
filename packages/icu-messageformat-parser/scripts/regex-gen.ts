import './global'
import regenerate from 'regenerate'
import {outputFileSync} from 'fs-extra'
import minimist from 'minimist'

function main(args: minimist.ParsedArgs) {
  const spaceSeparator = regenerate().add(
    require('@unicode/unicode-13.0.0/General_Category/Space_Separator/code-points.js')
  )
  const ws = regenerate().add(
    require('@unicode/unicode-13.0.0/Binary_Property/Pattern_White_Space/code-points.js')
  )
  outputFileSync(
    args.out,
    `// @generated from regex-gen.ts
export const SPACE_SEPARATOR_REGEX = /${spaceSeparator.toString()}/
export const WHITE_SPACE_REGEX = /${ws.toString()}/
`
  )
}

if (require.main === module) {
  main(minimist(process.argv))
}
