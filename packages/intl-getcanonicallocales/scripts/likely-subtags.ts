import {outputFileSync} from 'fs-extra'
import minimist from 'minimist'
import * as likelySubtags from 'cldr-core/supplemental/likelySubtags.json'
import stringify from 'json-stable-stringify'
function main({out}: minimist.ParsedArgs) {
  outputFileSync(
    out,
    `/* @generated */	
// prettier-ignore  
export const likelySubtags: Record<string, string> = ${stringify(
      likelySubtags.supplemental.likelySubtags,
      {space: 2}
    )};
`
  )
}

if (require.main === module) {
  main(minimist(process.argv))
}
