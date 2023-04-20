import * as rawTimeData from 'cldr-core/supplemental/timeData.json'
import {outputFileSync} from 'fs-extra'
import minimist from 'minimist'
import stringify from 'json-stable-stringify'

function main(args: minimist.ParsedArgs) {
  const {timeData} = rawTimeData.supplemental
  const data = Object.keys(timeData).reduce(
    (all: Record<string, string[]>, k) => {
      all[k.replace('_', '-')] =
        timeData[k as keyof typeof timeData]._allowed.split(' ')
      return all
    },
    {}
  )
  outputFileSync(
    args.out,
    `// @generated from time-data-gen.ts
// prettier-ignore  
export const timeData: Record<string, string[]> = ${stringify(data, {
      space: 2,
    })};
`
  )
}

if (require.main === module) {
  main(minimist(process.argv))
}
