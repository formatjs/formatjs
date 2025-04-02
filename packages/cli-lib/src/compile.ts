import {MessageFormatElement, parse} from '@formatjs/icu-messageformat-parser'
import {outputFile, readJSON} from 'fs-extra'
import stringify from 'json-stable-stringify'
import {debug, warn, writeStdout} from './console_utils.js'
import {Formatter, resolveBuiltinFormatter} from './formatters/index.js'
import {
  generateENXA,
  generateENXB,
  generateXXAC,
  generateXXHA,
  generateXXLS,
} from './pseudo_locale.js'

export type CompileFn = (msgs: any) => Record<string, string>

export type PseudoLocale = 'xx-LS' | 'xx-AC' | 'xx-HA' | 'en-XA' | 'en-XB'

export interface CompileCLIOpts extends Opts {
  /**
   * The target file that contains compiled messages.
   */
  outFile?: string
}
export interface Opts {
  /**
   * Whether to compile message into AST instead of just string
   */
  ast?: boolean
  /**
   * Whether to continue compiling messages after encountering an error.
   * Any keys with errors will not be included in the output file.
   */
  skipErrors?: boolean
  /**
   * Path to a formatter file that converts <translation_files> to
   * `Record<string, string>` so we can compile.
   */
  format?: string | Formatter<unknown>
  /**
   * Whether to compile to pseudo locale
   */
  pseudoLocale?: PseudoLocale
  /**
   * Whether the parser to treat HTML/XML tags as string literal
   * instead of parsing them as tag token.
   * When this is false we only allow simple tags without
   * any attributes
   */
  ignoreTag?: boolean
}

/**
 * Aggregate `inputFiles` into a single JSON blob and compile.
 * Also checks for conflicting IDs.
 * Then returns the serialized result as a `string` since key order
 * makes a difference in some vendor.
 * @param inputFiles Input files
 * @param opts Options
 * @returns serialized result in string format
 */
export async function compile(
  inputFiles: string[],
  opts: Opts = {}
): Promise<string> {
  debug('Compiling files:', inputFiles)
  const {ast, format, pseudoLocale, skipErrors, ignoreTag} = opts
  const formatter = await resolveBuiltinFormatter(format)

  const messages: Record<string, string> = {}
  const messageAsts: Record<string, MessageFormatElement[]> = {}
  const idsWithFileName: Record<string, string> = {}
  const compiledFiles = await Promise.all(
    inputFiles.map(f => readJSON(f).then(formatter.compile))
  )
  debug('Compiled files:', compiledFiles)
  for (let i = 0; i < inputFiles.length; i++) {
    const inputFile = inputFiles[i]
    debug('Processing file:', inputFile)
    const compiled = compiledFiles[i]
    for (const id in compiled) {
      if (messages[id] && messages[id] !== compiled[id]) {
        throw new Error(`Conflicting ID "${id}" with different translation found in these 2 files:
ID: ${id}
Message from ${idsWithFileName[id]}: ${messages[id]}
Message from ${inputFile}: ${compiled[id]}
`)
      }
      try {
        const msgAst = parse(compiled[id], {ignoreTag})
        messages[id] = compiled[id]
        switch (pseudoLocale) {
          case 'xx-LS':
            messageAsts[id] = generateXXLS(msgAst)
            break
          case 'xx-AC':
            messageAsts[id] = generateXXAC(msgAst)
            break
          case 'xx-HA':
            messageAsts[id] = generateXXHA(msgAst)
            break
          case 'en-XA':
            messageAsts[id] = generateENXA(msgAst)
            break
          case 'en-XB':
            messageAsts[id] = generateENXB(msgAst)
            break
          default:
            messageAsts[id] = msgAst
            break
        }
        idsWithFileName[id] = inputFile
      } catch (e) {
        warn(
          'Error validating message "%s" with ID "%s" in file "%s"',
          compiled[id],
          id,
          inputFile
        )
        if (!skipErrors) {
          throw e
        }
      }
    }
  }

  return stringify(ast ? messageAsts : messages, {
    space: 2,
    cmp: formatter.compareMessages || undefined,
  })
}

/**
 * Aggregate `inputFiles` into a single JSON blob and compile.
 * Also checks for conflicting IDs and write output to `outFile`.
 * @param inputFiles Input files
 * @param compileOpts options
 * @returns A `Promise` that resolves if file was written successfully
 */
export default async function compileAndWrite(
  inputFiles: string[],
  compileOpts: CompileCLIOpts = {}
): Promise<void> {
  const {outFile, ...opts} = compileOpts
  const serializedResult = (await compile(inputFiles, opts)) + '\n'
  if (outFile) {
    debug('Writing output file:', outFile)
    return outputFile(outFile, serializedResult)
  }
  await writeStdout(serializedResult)
}
