import {outputFileSync} from 'fs-extra'
import minimist from 'minimist'
interface Args extends minimist.ParsedArgs {
  cldrFile: string[]
  localesToGen: string[]
  out: string
}

function main(args: Args) {
  const {out} = args

  // Aggregate all into ../test262-main.js
  outputFileSync(
    out,
    `// @generated
// @ts-nocheck
import './polyfill-force';
`
  )
}

if (require.main === module) {
  main(minimist<Args>(process.argv))
}
