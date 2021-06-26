import {outputFileSync} from 'fs-extra'
import minimist from 'minimist'
import * as likelySubtags from 'cldr-core/supplemental/likelySubtags.json'
function main({out}: minimist.ParsedArgs) {
  outputFileSync(
    out,
    `/* @generated */	
// prettier-ignore  
export const likelySubtags: Record<string, string> = ${JSON.stringify(
      likelySubtags.supplemental.likelySubtags,
      undefined,
      2
    )};
`
  )
}

if (require.main === module) {
  main(minimist(process.argv))
}
