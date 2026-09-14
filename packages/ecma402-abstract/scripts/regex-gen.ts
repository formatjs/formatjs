import {outputFileSync} from 'fs-extra/esm'
import minimist from 'minimist'
import regenerate from 'regenerate'
import symbolCodePoints from '@unicode/unicode-17.0.0/General_Category/Symbol/code-points.mjs'

function main(args: minimist.ParsedArgs) {
  const symbolSeparator = regenerate().add(symbolCodePoints)
  outputFileSync(
    args.out,
    `// @generated from regex-gen.ts
export const S_UNICODE_REGEX: RegExp = /${symbolSeparator.toString()}/
`
  )
}

if (import.meta.filename === process.argv[1]) {
  main(minimist(process.argv))
}
