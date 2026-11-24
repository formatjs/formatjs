import process from 'node:process'
import {outputFileSync} from 'fs-extra/esm'
import minimist from 'minimist'
import symbolCodePoints from '@unicode/unicode-17.0.0/General_Category/Symbol/code-points.mjs'
import hebrewCodePoints from '@unicode/unicode-17.0.0/Script/Hebrew/code-points.mjs'

interface Args extends minimist.ParsedArgs {
  out: string
}

function ranges(codePoints: readonly number[]): [number, number][] {
  const result: [number, number][] = []
  for (const codePoint of codePoints) {
    const last = result[result.length - 1]
    if (last && last[1] + 1 === codePoint) last[1] = codePoint
    else result.push([codePoint, codePoint])
  }
  return result
}

function main(args: Args) {
  outputFileSync(
    args.out,
    `// @generated from regex-gen.ts
export const SYMBOL_RANGES = ${JSON.stringify(ranges(symbolCodePoints))} as const
export const HEBREW_SCRIPT_RANGES = ${JSON.stringify(ranges(hebrewCodePoints))} as const
`
  )
}

if (import.meta.filename === process.argv[1]) {
  main(minimist<Args>(process.argv))
}
