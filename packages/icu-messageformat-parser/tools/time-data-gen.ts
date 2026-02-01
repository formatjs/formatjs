import rawTimeData from 'cldr-core/supplemental/timeData.json' with {type: 'json'}
import {outputFileSync} from 'fs-extra/esm'
import minimist from 'minimist'
import stringify from 'json-stable-stringify'

function generateTypeScript(data: Record<string, string[]>): string {
  return `// @generated from time-data-gen.ts
// prettier-ignore
export const timeData: Record<string, string[]> = ${stringify(data, {
    space: 2,
  })};
`
}

function generateRust(data: Record<string, string[]>): string {
  const entries = Object.entries(data)
    .map(([key, values]) => {
      const rustVec = values.map(v => `"${v}"`).join(', ')
      return `        ("${key}".to_string(), vec![${rustVec}])`
    })
    .join(',\n')

  return `// @generated from time-data-gen.ts
use once_cell::sync::Lazy;
use std::collections::HashMap;

/// Time format preferences by locale
pub static TIME_DATA: Lazy<HashMap<String, Vec<&'static str>>> = Lazy::new(|| {
    HashMap::from([
${entries}
    ])
});
`
}

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

  const outFile = typeof args.out === 'string' ? args.out : args.out?.[0]
  if (!outFile) {
    throw new Error('--out parameter is required')
  }

  const isRust = outFile.endsWith('.rs')
  const content = isRust ? generateRust(data) : generateTypeScript(data)

  outputFileSync(outFile, content)
}

main(minimist(process.argv))
