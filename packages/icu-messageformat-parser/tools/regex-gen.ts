import {outputFileSync} from 'fs-extra/esm'
import minimist from 'minimist'
import regenerate from 'regenerate'
import {createRequire} from 'node:module'
import './global.ts'

const require = createRequire(import.meta.url)

function generateTypeScript(
  spaceSeparator: regenerate,
  ws: regenerate
): string {
  return `// @generated from regex-gen.ts
export const SPACE_SEPARATOR_REGEX: RegExp = /${spaceSeparator.toString()}/
export const WHITE_SPACE_REGEX: RegExp = /${ws.toString()}/
`
}

function generateRust(spaceSeparator: regenerate, ws: regenerate): string {
  const spaceSeparatorPattern = spaceSeparator.toString()
  const wsPattern = ws.toString()

  return `// @generated from regex-gen.ts
use once_cell::sync::Lazy;
use regex::Regex;

/// Unicode Space Separator regex pattern
pub static SPACE_SEPARATOR_REGEX: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"${spaceSeparatorPattern}").expect("Failed to compile SPACE_SEPARATOR_REGEX")
});

/// Unicode White Space regex pattern
pub static WHITE_SPACE_REGEX: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"${wsPattern}").expect("Failed to compile WHITE_SPACE_REGEX")
});
`
}

function main(args: minimist.ParsedArgs) {
  const spaceSeparator = regenerate().add(
    require('@unicode/unicode-17.0.0/General_Category/Space_Separator/code-points.js')
  )
  const ws = regenerate().add(
    require('@unicode/unicode-17.0.0/Binary_Property/Pattern_White_Space/code-points.js')
  )

  const outFile = typeof args.out === 'string' ? args.out : args.out?.[0]
  if (!outFile) {
    throw new Error('--out parameter is required')
  }

  const isRust = outFile.endsWith('.rs')
  const content = isRust
    ? generateRust(spaceSeparator, ws)
    : generateTypeScript(spaceSeparator, ws)

  outputFileSync(outFile, content)
}

if (import.meta.filename === process.argv[1]) {
  main(minimist(process.argv))
}
