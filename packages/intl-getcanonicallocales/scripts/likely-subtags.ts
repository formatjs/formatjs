import {outputFileSync} from 'fs-extra/esm'
import minimist from 'minimist'
import likelySubtags from 'cldr-core/supplemental/likelySubtags.json' with {type: 'json'}
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

if (import.meta.filename === process.argv[1]) {
  main(minimist(process.argv))
}
