import {outputFileSync} from 'fs-extra/esm'
import minimist from 'minimist'
import regenerate from 'regenerate'
import patternWhiteSpaceCodePoints from '@unicode/unicode-17.0.0/Binary_Property/Pattern_White_Space/code-points.mjs'
import './global.ts'

function main(args: minimist.ParsedArgs) {
  const set = regenerate().add(patternWhiteSpaceCodePoints)
  outputFileSync(
    args.out,
    `// @generated from regex-gen.ts
export const WHITE_SPACE_REGEX: RegExp = /${set.toString()}/i`
  )
}

if (import.meta.filename === process.argv[1]) {
  main(minimist(process.argv))
}
