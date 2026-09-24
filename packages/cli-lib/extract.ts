import {outputFile} from 'fs-extra/esm'
import {
  debug,
  getStdinAsString,
  warn,
  writeStdout,
} from '#packages/cli-lib/console_utils.js'
import * as stringifyNs from 'json-stable-stringify'
import {extname} from 'path'
import {availableParallelism} from 'os'

import {
  type Formatter,
  resolveBuiltinFormatter,
} from '#packages/cli-lib/formatters/index.js'
import {
  extractFilesWithNative,
  extractSourcesWithNative,
  generateIdWithNative,
  type NativeMessageDescriptor,
} from '#packages/cli-lib/native.js'
import {
  type ExtractTransformOptions,
  type MessageDescriptor,
} from '#packages/cli-lib/types.js'
import {readFile} from 'fs/promises'

const stringify = (stringifyNs as any).default || stringifyNs
const DEFAULT_ID_INTERPOLATION_PATTERN = '[sha1:contenthash:base64:6]'
export interface ExtractionResult<M = Record<string, string>> {
  /**
   * List of extracted messages
   */
  messages: MessageDescriptor[]
  /**
   * Metadata extracted w/ `pragma`
   */
  meta?: M
}

export interface ExtractedMessageDescriptor extends MessageDescriptor {
  /**
   * Line number
   */
  line?: number
  /**
   * Column number
   */
  col?: number
  /**
   * Metadata extracted from pragma
   */
  meta?: Record<string, string>
}

export type ExtractCLIOptions = Omit<
  ExtractOpts,
  'overrideIdFn' | 'onMsgExtracted' | 'onMetaExtracted'
> & {
  /**
   * Output File
   */
  outFile?: string
  /**
   * Input File
   */
  inFile?: string
  /**
   * Ignore file glob pattern
   */
  ignore?: string[]
  /**
   * Whether to follow symbolic links when traversing directories.
   * Defaults to true for compatibility with pnpm symlinked node_modules.
   */
  followLinks?: boolean
}

export type ExtractOpts = ExtractTransformOptions & {
  /**
   * Whether to throw an error if we had any issues with
   * 1 of the source files
   */
  throws?: boolean
  /**
   * Message ID interpolation pattern
   */
  idInterpolationPattern?: string
  /**
   * Whether we read from stdin instead of a file
   */
  readFromStdin?: boolean
  /**
   * Either path to a formatter file that controls the shape of JSON file from `outFile` or {@link Formatter} object.
   */
  format?: string | Formatter<any>
  /**
   * Whether to hoist selectors & flatten sentences
   */
  flatten?: boolean
  /**
   * An AbortSignal to cancel the extraction
   */
  signal?: AbortSignal
}

function byteOffsetToStringOffset(text: string, offset: number): number {
  return Buffer.from(text).subarray(0, offset).toString().length
}

function calculateLineColFromOffset(
  text: string,
  start?: number
): Pick<ExtractedMessageDescriptor, 'line' | 'col'> {
  if (!start) {
    return {line: 1, col: 1}
  }
  const chunk = text.slice(0, start)
  const lines = chunk.split('\n')
  const lastLine = lines[lines.length - 1]
  return {line: lines.length, col: lastLine.length}
}

function nativeScriptFilename(filename: string): string {
  const extension = extname(filename).toLowerCase()
  if (
    [
      '.cjs',
      '.cts',
      '.js',
      '.jsx',
      '.mjs',
      '.mts',
      '.rs',
      '.ts',
      '.tsx',
    ].includes(extension)
  ) {
    return filename
  }
  return `${filename}.tsx`
}

function applyOverrideId(
  message: NativeMessageDescriptor,
  filename: string,
  overrideIdFn: ExtractTransformOptions['overrideIdFn']
): MessageDescriptor {
  const id =
    typeof overrideIdFn === 'function'
      ? overrideIdFn(
          message.id,
          message.defaultMessage,
          message.description,
          filename
        )
      : message.id
  return {...message, id: id || ''}
}

async function processFile(source: string, fn: string, opts: ExtractOpts) {
  let messages: ExtractedMessageDescriptor[] = []
  let meta: Record<string, string> | undefined
  const idInterpolationPattern =
    typeof opts.overrideIdFn === 'string'
      ? opts.overrideIdFn
      : opts.idInterpolationPattern || DEFAULT_ID_INTERPOLATION_PATTERN

  debug('Processing opts for %s: %s', fn, opts)

  const collectMessages = (
    filePath: string,
    extracted: MessageDescriptor[]
  ) => {
    messages = messages.concat(extracted)
    opts.onMsgExtracted?.(filePath, extracted)
  }
  const scriptParseFn = (
    scriptSource: string,
    sourceOffset = 0,
    wrapperOffset = 0
  ): void => {
    const result = extractSourcesWithNative(
      [{filename: nativeScriptFilename(fn), source: scriptSource}],
      {
        additionalComponentNames: [
          '$formatMessage',
          ...(opts.additionalComponentNames || []),
        ],
        additionalFunctionNames: opts.additionalFunctionNames,
        extractSourceLocation: opts.extractSourceLocation,
        idInterpolationPattern,
        pragma: opts.pragma,
        preserveWhitespace: opts.preserveWhitespace,
        flatten: opts.flatten,
        throws: opts.throws,
      },
      typeof opts.overrideIdFn !== 'function'
    )
    const file = result.files[0]
    if (!file) return
    if (file.meta) {
      meta = {...meta, ...file.meta}
    }
    for (const error of file.errors || []) {
      opts.onMsgError?.(fn, new Error(error))
    }
    let extracted = file.messages.map(message =>
      applyOverrideId(message, fn, opts.overrideIdFn)
    )
    if (opts.extractSourceLocation) {
      extracted = extracted.map(message => {
        const start =
          message.start === undefined
            ? undefined
            : sourceOffset +
              Math.max(
                0,
                byteOffsetToStringOffset(scriptSource, message.start) -
                  wrapperOffset
              )
        const end =
          message.end === undefined
            ? undefined
            : sourceOffset +
              Math.max(
                0,
                byteOffsetToStringOffset(scriptSource, message.end) -
                  wrapperOffset
              )
        return {
          ...message,
          file: fn,
          start,
          end,
          ...calculateLineColFromOffset(source, start),
        }
      })
    }
    collectMessages(fn, extracted)
  }
  const hbsOptions: ExtractTransformOptions = {
    ...opts,
    overrideIdFn:
      typeof opts.overrideIdFn === 'function'
        ? opts.overrideIdFn
        : (id, defaultMessage, description, filename) =>
            id ||
            generateIdWithNative(
              idInterpolationPattern,
              defaultMessage,
              description,
              filename
            ),
    onMsgExtracted: collectMessages,
    onMetaExtracted(_filePath, extractedMeta) {
      meta = {...meta, ...extractedMeta}
    },
  }
  if (fn.endsWith('.vue')) {
    debug('Processing %s using vue extractor', fn)
    const {parseFile} = await import('./vue_extractor.js')
    parseFile(source, fn, scriptParseFn)
  } else if (fn.endsWith('.svelte')) {
    debug('Processing %s using svelte extractor', fn)
    const {parseFile} = await import('./svelte_extractor.js')
    parseFile(source, fn, scriptParseFn)
  } else if (fn.endsWith('.hbs')) {
    debug('Processing %s using hbs extractor', fn)
    const {parseFile} = await import('./hbs_extractor.js')
    parseFile(source, fn, hbsOptions)
  } else if (fn.endsWith('.gts') || fn.endsWith('.gjs')) {
    debug('Processing %s as gts/gjs file', fn)
    const {parseFile} = await import('./gts_extractor.js')
    parseFile(source, fn, hbsOptions, scriptParseFn)
  } else {
    debug('Processing %s using native extractor', fn)
    scriptParseFn(source)
  }
  debug('Done extracting %s messages: %s', fn, messages)
  if (meta) {
    debug('Extracted meta:', meta)
    messages.forEach(m => (m.meta = meta))
    opts.onMetaExtracted?.(fn, meta)
  }
  return {messages, meta}
}

function canExtractFilesWithNative(
  files: readonly string[],
  opts: ExtractOpts
): boolean {
  return (
    files.length > 0 &&
    !opts.readFromStdin &&
    !opts.signal &&
    !opts.extractSourceLocation &&
    !opts.onMsgExtracted &&
    !opts.onMetaExtracted &&
    !opts.onMsgError &&
    typeof opts.overrideIdFn !== 'function' &&
    files.every(filename =>
      [
        '.cjs',
        '.cts',
        '.js',
        '.jsx',
        '.mjs',
        '.mts',
        '.rs',
        '.ts',
        '.tsx',
      ].includes(extname(filename))
    )
  )
}

// Match Rayon's default worker count and explicit thread override.
function fileReadConcurrency(): number {
  const value = process.env.RAYON_NUM_THREADS || ''
  const threads = /^\+?\d+$/.test(value) ? Number(value) : 0
  return Number.isSafeInteger(threads) && threads > 0
    ? threads
    : availableParallelism()
}

async function mapWithConcurrencyLimit<T, R>(
  items: readonly T[],
  limit: number,
  task: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = []
  let nextIndex = 0
  let failed = false
  async function worker(): Promise<void> {
    while (!failed && nextIndex < items.length) {
      const index = nextIndex++
      try {
        results[index] = await task(items[index])
      } catch (error) {
        failed = true
        throw error
      }
    }
  }
  await Promise.all(
    Array.from({length: Math.min(limit, items.length)}, () => worker())
  )
  return results
}

/**
 * Extract strings from source files
 * @param files list of files
 * @param extractOpts extract options
 * @returns messages serialized as JSON string since key order
 * matters for some `format`
 */
export async function extract(
  files: readonly string[],
  extractOpts: ExtractOpts
): Promise<string> {
  const {throws, readFromStdin, signal, ...opts} = extractOpts
  // Message errors may be skipped; input read failures are always fatal.
  const shouldThrow = throws === true
  // Pass throws option to transformer for per-message error handling
  const optsWithThrows = {
    ...opts,
    idInterpolationPattern:
      opts.idInterpolationPattern || DEFAULT_ID_INTERPOLATION_PATTERN,
    throws: shouldThrow,
    onMsgError: !shouldThrow
      ? opts.onMsgError || ((_: string, e: Error) => warn(e.message))
      : undefined,
  }

  async function processSource(source: string, filename: string) {
    try {
      return await processFile(source, filename, optsWithThrows)
    } catch (error) {
      if (shouldThrow) throw error
      warn(String(error))
      return undefined
    }
  }

  let rawResults: Array<ExtractionResult | undefined>
  if (canExtractFilesWithNative(files, extractOpts)) {
    const result = extractFilesWithNative(files, {
      additionalComponentNames: [
        '$formatMessage',
        ...(opts.additionalComponentNames || []),
      ],
      additionalFunctionNames: opts.additionalFunctionNames,
      idInterpolationPattern:
        typeof opts.overrideIdFn === 'string'
          ? opts.overrideIdFn
          : optsWithThrows.idInterpolationPattern,
      pragma: opts.pragma,
      preserveWhitespace: opts.preserveWhitespace,
      flatten: opts.flatten,
      throws: shouldThrow,
    })
    rawResults = result.files.map(file => {
      for (const error of file.errors || []) warn(error)
      return {
        messages: file.messages.map(message => ({
          ...applyOverrideId(message, file.filename, opts.overrideIdFn),
          ...(file.meta ? {meta: file.meta} : {}),
        })),
        meta: file.meta,
      }
    })
  } else if (readFromStdin) {
    debug('Reading input from stdin')
    if (process.stdin.isTTY) {
      warn('Reading source file from TTY.')
    }
    const source = await getStdinAsString()
    rawResults = [await processSource(source, 'dummy.ts')]
  } else {
    rawResults = await mapWithConcurrencyLimit(
      files,
      fileReadConcurrency(),
      async filename => {
        debug('Extracting file:', filename)
        const source = await readFile(filename, {encoding: 'utf8', signal})
        return processSource(source, filename)
      }
    )
  }

  const formatter: Formatter<unknown> = await resolveBuiltinFormatter(
    opts.format
  )
  const extractionResults = rawResults.filter((r): r is ExtractionResult => !!r)

  const extractedMessages = new Map<string, MessageDescriptor>()

  for (const {messages} of extractionResults) {
    for (const message of messages) {
      const {id, description, defaultMessage} = message
      if (!id) {
        const error = new Error(
          `[FormatJS CLI] Missing message id for message:
${JSON.stringify(message, undefined, 2)}`
        )
        if (throws) {
          throw error
        } else {
          warn(error.message)
        }
        continue
      }

      if (extractedMessages.has(id)) {
        const existing = extractedMessages.get(id)!
        if (
          stringify(description) !== stringify(existing.description) ||
          defaultMessage !== existing.defaultMessage
        ) {
          const error = new Error(
            `[FormatJS CLI] Duplicate message id: "${id}", ` +
              'but the `description` and/or `defaultMessage` are different.'
          )
          if (throws) {
            throw error
          } else {
            warn(error.message)
          }
        }
      }
      extractedMessages.set(id, message)
    }
  }
  const results: Record<string, Omit<MessageDescriptor, 'id'>> = {}
  const messages = Array.from(extractedMessages.values())
  for (const {id, ...msg} of messages) {
    // GH #3537: flatten is now applied during extraction in the babel plugin,
    // so we don't need to apply it again here. The messages are already flattened.
    results[id] = msg
  }
  if (typeof formatter.serialize === 'function') {
    return formatter.serialize(formatter.format(results as any))
  }
  return (
    stringify(formatter.format(results as any), {
      space: 2,
      cmp: formatter.compareMessages || undefined,
    }) ?? ''
  )
}

/**
 * Extract strings from source files, also writes to a file.
 * @param files list of files
 * @param extractOpts extract options
 * @returns A Promise that resolves if output file was written successfully
 */
export default async function extractAndWrite(
  files: readonly string[],
  extractOpts: ExtractCLIOptions
): Promise<void> {
  const {outFile, ...opts} = extractOpts
  const serializedResult = (await extract(files, opts)) + '\n'
  if (outFile) {
    debug('Writing output file:', outFile)
    return outputFile(outFile, serializedResult)
  }
  await writeStdout(serializedResult)
}
