import {outputFileSync} from 'fs-extra/esm'
import minimist from 'minimist'
import regenerate from 'regenerate'
import spaceSeparatorCodePoints from '@unicode/unicode-17.0.0/General_Category/Space_Separator/code-points.mjs'
import patternWhiteSpaceCodePoints from '@unicode/unicode-17.0.0/Binary_Property/Pattern_White_Space/code-points.mjs'
import whiteSpaceCodePoints from '@unicode/unicode-17.0.0/Binary_Property/White_Space/code-points.mjs'
import patternSyntaxCodePoints from '@unicode/unicode-17.0.0/Binary_Property/Pattern_Syntax/code-points.mjs'
import './global.ts'

function generateTypeScript(
  spaceSeparator: regenerate,
  ws: regenerate,
  identifierBoundary: regenerate
): string {
  const boundaryPattern = identifierBoundary.toString({bmpOnly: true})
  if (!boundaryPattern.startsWith('[') || !boundaryPattern.endsWith(']')) {
    throw new Error('Expected an identifier boundary character class')
  }
  return `// @generated from regex-gen.ts
export const SPACE_SEPARATOR_REGEX: RegExp = /${spaceSeparator.toString()}/
export const WHITE_SPACE_REGEX: RegExp = /${ws.toString()}/
export const IDENTIFIER_PREFIX_REGEX: RegExp = /([^${boundaryPattern.slice(1, -1)}]*)/g
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

interface Args extends minimist.ParsedArgs {
  out?: string | string[]
}

function main(args: Args) {
  const spaceSeparator = regenerate().add(spaceSeparatorCodePoints)
  const ws = regenerate().add(patternWhiteSpaceCodePoints)
  // Both properties contain only BMP characters; all surrogate code units
  // remain valid identifier characters, including unpaired surrogates.
  if (
    [...whiteSpaceCodePoints, ...patternSyntaxCodePoints].some(c => c > 0xffff)
  ) {
    throw new Error('Identifier boundaries must contain only BMP characters')
  }
  const identifierBoundary = regenerate()
    .add(whiteSpaceCodePoints)
    .add(patternSyntaxCodePoints)

  const outFile = typeof args.out === 'string' ? args.out : args.out?.[0]
  if (!outFile) {
    throw new Error('--out parameter is required')
  }

  const isRust = outFile.endsWith('.rs')
  const content = isRust
    ? generateRust(spaceSeparator, ws)
    : generateTypeScript(spaceSeparator, ws, identifierBoundary)

  outputFileSync(outFile, content)
}

if (import.meta.filename === process.argv[1]) {
  main(minimist(process.argv))
}
