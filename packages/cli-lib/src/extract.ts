import {
  MessageDescriptor,
  Opts,
  interpolateName,
} from '@formatjs/ts-transformer'
import {outputFile, readFile} from 'fs-extra'
import {debug, getStdinAsString, warn, writeStdout} from './console_utils'

import {parse} from '@formatjs/icu-messageformat-parser'
import {hoistSelectors} from '@formatjs/icu-messageformat-parser/manipulator'
import {printAST} from '@formatjs/icu-messageformat-parser/printer'
import stringify from 'json-stable-stringify'
import {Formatter, resolveBuiltinFormatter} from './formatters'
import {parseScript} from './parse_script'
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
}

export type ExtractOpts = Opts & {
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
} & Pick<Opts, 'onMsgExtracted' | 'onMetaExtracted'>

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

async function processFile(
  source: string,
  fn: string,
  {idInterpolationPattern, ...opts}: Opts & {idInterpolationPattern?: string}
) {
  let messages: ExtractedMessageDescriptor[] = []
  let meta: Record<string, string> | undefined

  const onMsgExtracted = opts.onMsgExtracted
  const onMetaExtracted = opts.onMetaExtracted

  opts = {
    ...opts,
    additionalComponentNames: [
      '$formatMessage',
      ...(opts.additionalComponentNames || []),
    ],
    onMsgExtracted(filePath, msgs) {
      if (opts.extractSourceLocation) {
        msgs = msgs.map(msg => ({
          ...msg,
          ...calculateLineColFromOffset(source, msg.start),
        }))
      }
      messages = messages.concat(msgs)

      if (onMsgExtracted) {
        onMsgExtracted(filePath, msgs)
      }
    },
    onMetaExtracted(filePath, m) {
      meta = m

      if (onMetaExtracted) {
        onMetaExtracted(filePath, m)
      }
    },
  }

  if (!opts.overrideIdFn && idInterpolationPattern) {
    opts = {
      ...opts,
      overrideIdFn: (id, defaultMessage, description, fileName) =>
        id ||
        interpolateName(
          {
            resourcePath: fileName,
          } as any,
          idInterpolationPattern,
          {
            content: description
              ? `${defaultMessage}#${
                  typeof description === 'string'
                    ? description
                    : stringify(description)
                }`
              : defaultMessage,
          }
        ),
    }
  }

  debug('Processing opts for %s: %s', fn, opts)

  const scriptParseFn = parseScript(opts, fn)
  if (fn.endsWith('.vue')) {
    debug('Processing %s using vue extractor', fn)
    const {parseFile} = await import('./vue_extractor.js')
    parseFile(source, fn, scriptParseFn)
  } else if (fn.endsWith('.hbs')) {
    debug('Processing %s using hbs extractor', fn)
    const {parseFile} = await import('./hbs_extractor.js')
    parseFile(source, fn, opts)
  } else if (fn.endsWith('.gts') || fn.endsWith('.gjs')) {
    debug('Processing %s as gts/gjs file', fn)
    const {parseFile} = await import('./gts_extractor.js')
    parseFile(source, fn, opts)
  } else {
    debug('Processing %s using typescript extractor', fn)
    scriptParseFn(source)
  }
  debug('Done extracting %s messages: %s', fn, messages)
  if (meta) {
    debug('Extracted meta:', meta)
    messages.forEach(m => (m.meta = meta))
  }
  return {messages, meta}
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
  const {throws, readFromStdin, flatten, ...opts} = extractOpts
  let rawResults: Array<ExtractionResult | undefined> = []
  try {
    if (readFromStdin) {
      debug(`Reading input from stdin`)
      // Read from stdin
      if (process.stdin.isTTY) {
        warn('Reading source file from TTY.')
      }
      const stdinSource = await getStdinAsString()
      rawResults = [await processFile(stdinSource, 'dummy', opts)]
    } else {
      rawResults = await Promise.all(
        files.map(async fn => {
          debug('Extracting file:', fn)
          const source = await readFile(fn, 'utf8')
          return processFile(source, fn, opts)
        })
      )
    }
  } catch (e) {
    if (throws) {
      throw e
    } else {
      warn(String(e))
    }
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
    if (flatten && msg.defaultMessage) {
      msg.defaultMessage = printAST(hoistSelectors(parse(msg.defaultMessage)))
    }
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
