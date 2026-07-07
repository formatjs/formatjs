import {outputFile} from 'fs-extra/esm'
import {readFile} from 'fs/promises'
import glob from 'fast-glob'
import * as stringifyNs from 'json-stable-stringify'
import {resolve} from 'path'
import {pathToFileURL} from 'url'
import {debug, warn, writeStdout} from '#packages/cli-lib/console_utils.js'
import {type Formatter} from '#packages/cli-lib/formatters/index.js'
import {
  type NativeCompileMessage,
  compileMessagesWithNative,
  compileWithNative,
} from '#packages/cli-lib/native.js'

const dynamicImport = new Function('specifier', 'return import(specifier)') as (
  specifier: string
) => Promise<Formatter<unknown>>
const globSync = glob.sync
const stringify = (stringifyNs as any).default || stringifyNs
const CUSTOM_FORMATTER_FILE_DEPRECATION_WARNING =
  'Passing a custom formatter file to --format during compilation is deprecated and will be removed in a future release. Prefer a built-in formatter name or pre-process translation files before running formatjs compile.'

const BUILTIN_FORMATTERS = new Set([
  'default',
  'simple',
  'transifex',
  'smartling',
  'lokalise',
  'crowdin',
])

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
   * Built-in formatter name or path to a formatter file that converts
   * <translation_files> to `Record<string, string>` so we can compile.
   * Formatter file paths are deprecated for compilation.
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
  /**
   * An AbortSignal to cancel the compilation before invoking native code.
   */
  signal?: AbortSignal
  /**
   * Whether to follow symbolic links when traversing directories.
   * Defaults to true for compatibility with pnpm symlinked node_modules.
   */
  followLinks?: boolean
}

/**
 * Compile extracted translation files with the native formatjs CLI binding.
 * @param inputFiles Input files or glob patterns
 * @param opts Options
 * @returns serialized result in string format
 */
export async function compile(
  inputFiles: string[],
  opts: Opts = {}
): Promise<string> {
  debug('Compiling files:', inputFiles)
  const {
    ast,
    format,
    pseudoLocale,
    skipErrors,
    ignoreTag,
    signal,
    followLinks,
  } = opts
  signal?.throwIfAborted()

  if (format && !isBuiltinFormatter(format)) {
    return compileWithCustomFormatter(inputFiles, opts)
  }

  return compileWithNative(inputFiles, {
    ast,
    format: typeof format === 'string' ? format : undefined,
    followLinks,
    ignoreTag,
    pseudoLocale,
    skipErrors,
  })
}

function isBuiltinFormatter(
  format: string | Formatter<unknown>
): format is string {
  return typeof format === 'string' && BUILTIN_FORMATTERS.has(format)
}

async function compileWithCustomFormatter(
  inputFiles: string[],
  opts: Opts
): Promise<string> {
  if (typeof opts.format === 'string') {
    await warn(CUSTOM_FORMATTER_FILE_DEPRECATION_WARNING)
  }

  const formatter = await resolveCustomFormatter(opts.format)
  const files = globSync(inputFiles, {
    followSymbolicLinks: opts.followLinks ?? true,
  })

  if (!files.length) {
    throw new Error('No translation files found matching the patterns')
  }

  const messages: NativeCompileMessage[] = []
  await Promise.all(
    files.map(async file => {
      opts.signal?.throwIfAborted()
      const content = await readFile(file, {
        encoding: 'utf8',
        signal: opts.signal,
      })
      const compiled = formatter.compile(JSON.parse(content))
      for (const id of Object.keys(compiled)) {
        messages.push({
          id,
          message: compiled[id],
          sourceFile: file,
        })
      }
    })
  )

  const serialized = compileMessagesWithNative(messages, {
    ast: opts.ast,
    ignoreTag: opts.ignoreTag,
    pseudoLocale: opts.pseudoLocale,
    skipErrors: opts.skipErrors,
  })

  if (formatter.compareMessages) {
    return (
      stringify(JSON.parse(serialized), {
        space: 2,
        cmp: formatter.compareMessages,
      }) ?? ''
    )
  }

  return serialized
}

async function resolveCustomFormatter(
  format: string | Formatter<unknown> | undefined
): Promise<Formatter<unknown>> {
  if (!format) {
    throw new Error('A custom formatter is required')
  }
  if (typeof format !== 'string') {
    return format
  }
  try {
    return dynamicImport(pathToFileURL(resolve(process.cwd(), format)).href)
  } catch (e) {
    console.error(`Cannot resolve formatter ${format}`)
    throw e
  }
}

/**
 * Compile extracted translation files with the native formatjs CLI binding and
 * write output to `outFile` when provided.
 * @param inputFiles Input files or glob patterns
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
