import {warn, debug} from './console_utils'
import {readFile} from 'fs-extra'
import {
  interpolateName,
  Opts,
  MessageDescriptor,
} from '@formatjs/ts-transformer'

import {resolveBuiltinFormatter, Formatter} from './formatters'
import {parseFile} from './vue_extractor'
import {parseScript} from './parse_script'
import {printAST} from '@formatjs/icu-messageformat-parser/printer'
import {hoistSelectors} from '@formatjs/icu-messageformat-parser/manipulator'
import {parse} from '@formatjs/icu-messageformat-parser'

export type ValidateCLIOptions = Omit<
  ValidateOpts,
  'overrideIdFn' | 'onMsgExtracted' | 'onMetaExtracted'
> & {
  /**
   * Output File
   */
  inFile: string
  /**
   * Ignore file glob pattern
   */
  ignore?: string[]
}

export type ValidateOpts = Omit<Opts, 'extractSourceLocation'> & {
  /**
   * Message ID interpolation pattern
   */
  idInterpolationPattern?: string
  /**
   * Path to a formatter file that controls the shape of JSON file from `outFile`.
   */
  format?: string | Formatter
  /**
   * Whether to hoist selectors & flatten sentences
   */
  flatten?: boolean
}

function processFile(
  source: string,
  fn: string,
  {idInterpolationPattern, ...opts}: Opts & {idInterpolationPattern?: string}
) {
  let messages: MessageDescriptor[] = []

  opts = {
    ...opts,
    additionalComponentNames: [
      '$formatMessage',
      ...(opts.additionalComponentNames || []),
    ],
    onMsgExtracted(_, msgs) {
      messages = messages.concat(msgs)
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
              ? `${defaultMessage}#${description}`
              : defaultMessage,
          }
        ),
    }
  }

  debug('Processing opts for %s: %s', fn, opts)

  const scriptParseFn = parseScript(opts, fn)
  if (fn.endsWith('.vue')) {
    debug('Processing %s using vue extractor', fn)
    parseFile(source, fn, scriptParseFn)
  } else {
    debug('Processing %s using typescript extractor', fn)
    scriptParseFn(source)
  }
  debug('Done extracting %s messages: %s', fn, messages)
  return messages
}

/**
 * Extract strings from source files
 * @param files list of files
 * @param validateOpts extract options
 * @returns messages serialized as JSON string since key order
 * matters for some `format`
 */
export async function validate(
  files: readonly string[],
  inFileTranslations: any,
  validateOpts: ValidateOpts
) {
  let valid = true
  const {flatten, ...opts} = validateOpts
  const rawResults: (MessageDescriptor[] | undefined)[] = await Promise.all(
    files.map(async fn => {
      debug('Extracting file:', fn)
      try {
        const source = await readFile(fn, 'utf8')
        return processFile(source, fn, opts)
      } catch (e) {
        valid = false
        warn(String(e))
      }
    })
  )

  const formatter = await resolveBuiltinFormatter(opts.format)
  const validationResults = rawResults.filter(
    (r): r is MessageDescriptor[] => !!r
  )

  const extractedMessages = new Map<string, MessageDescriptor>()

  for (const messages of validationResults) {
    for (const message of messages) {
      const {id, description, defaultMessage} = message
      if (!id) {
        const error = new Error(
          `[FormatJS CLI] Missing message id for message: 
${JSON.stringify(message, undefined, 2)}`
        )
        warn(error.message)
        valid = false
        continue
      }

      if (extractedMessages.has(id)) {
        const existing = extractedMessages.get(id)!
        if (
          description !== existing.description ||
          defaultMessage !== existing.defaultMessage
        ) {
          const error = new Error(
            `[FormatJS CLI] Duplicate message id: "${id}", ` +
              'but the `description` and/or `defaultMessage` are different.'
          )
          warn(error.message)
          valid = false
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

  const formattedResults = formatter.format(results)
  const allIds = Array.from(
    new Set([
      ...Object.keys(formattedResults),
      ...Object.keys(inFileTranslations),
    ])
  )

  for (const id of allIds) {
    const extractedTranslation = formattedResults[id]
    const inFileTranslation = inFileTranslations[id]

    if (inFileTranslation === undefined) {
      const error = new Error(
        `[FormatJS CLI] Translation id: "${id}" was extracted but did not exist in \`inFile\`.`
      )
      warn(error.message)
      valid = false
    } else if (extractedTranslation === undefined) {
      const error = new Error(
        `[FormatJS CLI] Translation id: "${id}" was not extracted but exists in \`inFile\`.`
      )
      warn(error.message)
      valid = false
    } else if (
      JSON.stringify(extractedTranslation) !== JSON.stringify(inFileTranslation)
    ) {
      const error = new Error(
        `[FormatJS CLI] Translation id: "${id}" was extracted, but differed to the definition in \`inFile\`.`
      )
      warn(error.message)
      valid = false
    }
  }

  return valid
}

/**
 * Extract strings from source files, also writes to a file.
 * @param files list of files
 * @param validateOpts extract options
 * @returns A Promise that resolves if output file was written successfully
 */
export default async function extractAndWrite(
  files: readonly string[],
  validateOpts: ValidateCLIOptions
) {
  const translations = JSON.parse(await readFile(validateOpts.inFile, 'utf8'))
  const {inFile, ...opts} = validateOpts
  const valid = (await validate(files, translations, opts)) + '\n'
  return valid
}
