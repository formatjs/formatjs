import {outputFileSync} from 'fs-extra/esm'
import minimist from 'minimist'
import regenerate from 'regenerate'

function main(args: minimist.ParsedArgs) {
  const symbolSeparator = regenerate().add(
    require('@unicode/unicode-13.0.0/General_Category/Symbol/code-points.js')
  )
  outputFileSync(
    args.out,
    `// @generated from regex-gen.ts
export const S_UNICODE_REGEX: RegExp = /${symbolSeparator.toString()}/
`
  )
}

if (require.main === module) {
  main(minimist(process.argv))
}
