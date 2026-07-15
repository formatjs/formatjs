import {isStructurallySame, parse} from '@formatjs/icu-messageformat-parser'
import {
  transformWithTs,
  type MessageDescriptorOccurrence,
  type MessageDescriptorValueLocation,
  type Opts as TransformerOpts,
} from '@formatjs/ts-transformer'
import {readFile, writeFile} from 'fs/promises'
import {extname} from 'path'
import ts from 'typescript'
import {
  type Formatter,
  resolveBuiltinFormatter,
} from '#packages/cli-lib/formatters/index.js'

const SUPPORTED_EXTENSIONS = new Set([
  '.cjs',
  '.cts',
  '.js',
  '.jsx',
  '.mjs',
  '.mts',
  '.ts',
  '.tsx',
])

const SYNC_SOURCE_FORMATS = new Set<SyncSourceFormat>([
  'default',
  'simple',
  'transifex',
  'smartling',
  'lokalise',
  'crowdin',
])

export type SyncSourceFormat =
  | 'default'
  | 'simple'
  | 'transifex'
  | 'smartling'
  | 'lokalise'
  | 'crowdin'

export interface SyncSourceOptions extends Pick<
  TransformerOpts,
  'additionalComponentNames' | 'additionalFunctionNames'
> {
  /** Write changes to source files. Defaults to check-only mode. */
  write?: boolean
  signal?: AbortSignal
}

export interface SyncSourceChange {
  file: string
  id: string
  line: number
  col: number
  previous: string
  next: string
}

export interface SyncSourceDiagnostic {
  file: string
  message: string
}

export interface SyncSourceResult {
  changes: SyncSourceChange[]
  changedFiles: string[]
  warnings: SyncSourceDiagnostic[]
}

export interface SyncSourceFileOptions extends SyncSourceOptions {
  sourceFile: string
  /** Built-in catalog format. Defaults to `simple`. */
  format?: SyncSourceFormat
}

interface PlannedChange extends SyncSourceChange {
  start: number
  end: number
  replacement: string
}

interface FilePlan {
  file: string
  source: string
  changes: PlannedChange[]
}

function sourcePosition(source: string, offset: number) {
  const lines = source.slice(0, offset).split('\n')
  return {line: lines.length, col: lines[lines.length - 1].length + 1}
}

function escapeCodeUnit(code: number): string {
  return `\\u${code.toString(16).padStart(4, '0')}`
}

function quoteString(value: string, quote: "'" | '"'): string {
  let result = quote
  for (let i = 0; i < value.length; i++) {
    const char = value[i]
    const code = value.charCodeAt(i)
    if (char === '\\') {
      result += '\\\\'
    } else if (char === quote) {
      result += `\\${quote}`
    } else if (char === '\b') {
      result += '\\b'
    } else if (char === '\f') {
      result += '\\f'
    } else if (char === '\n') {
      result += '\\n'
    } else if (char === '\r') {
      result += '\\r'
    } else if (char === '\t') {
      result += '\\t'
    } else if (code < 0x20 || code === 0x2028 || code === 0x2029) {
      result += escapeCodeUnit(code)
    } else if (code >= 0xd800 && code <= 0xdbff) {
      const next = value.charCodeAt(i + 1)
      if (next >= 0xdc00 && next <= 0xdfff) {
        result += char + value[++i]
      } else {
        result += escapeCodeUnit(code)
      }
    } else if (code >= 0xdc00 && code <= 0xdfff) {
      result += escapeCodeUnit(code)
    } else {
      result += char
    }
  }
  return result + quote
}

function quoteTemplate(value: string): string {
  let result = '`'
  for (let i = 0; i < value.length; i++) {
    const char = value[i]
    const code = value.charCodeAt(i)
    if (char === '\\' || char === '`') {
      result += `\\${char}`
    } else if (char === '$' && value[i + 1] === '{') {
      result += '\\$'
    } else if (char === '\r') {
      result += '\\r'
    } else if (code < 0x20 && char !== '\n' && char !== '\t') {
      result += escapeCodeUnit(code)
    } else if (code === 0x2028 || code === 0x2029) {
      result += escapeCodeUnit(code)
    } else if (code >= 0xd800 && code <= 0xdbff) {
      const next = value.charCodeAt(i + 1)
      if (next >= 0xdc00 && next <= 0xdfff) {
        result += char + value[++i]
      } else {
        result += escapeCodeUnit(code)
      }
    } else if (code >= 0xdc00 && code <= 0xdfff) {
      result += escapeCodeUnit(code)
    } else {
      result += char
    }
  }
  return result + '`'
}

function replacementFor(
  source: string,
  location: MessageDescriptorValueLocation,
  value: string
): string {
  const token = source.slice(location.start, location.end)
  if (location.kind === 'template') {
    return quoteTemplate(value)
  }
  const quote = token.startsWith("'") ? "'" : '"'
  const literal = quoteString(value, quote)
  return location.kind === 'jsxAttribute' ? `{${literal}}` : literal
}

function formatDiagnostic(diagnostic: ts.Diagnostic): string {
  const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')
  if (!diagnostic.file || diagnostic.start == null) {
    return message
  }
  const {line, character} = diagnostic.file.getLineAndCharacterOfPosition(
    diagnostic.start
  )
  return `${diagnostic.file.fileName}:${line + 1}:${character + 1} ${message}`
}

function scanFile(
  file: string,
  source: string,
  options: SyncSourceOptions
): {
  occurrences: MessageDescriptorOccurrence[]
  errors: string[]
} {
  const occurrences: MessageDescriptorOccurrence[] = []
  const errors: string[] = []
  const result = ts.transpileModule(source, {
    compilerOptions: {
      allowJs: true,
      experimentalDecorators: true,
      noEmit: true,
      target: ts.ScriptTarget.ESNext,
    },
    fileName: file,
    reportDiagnostics: true,
    transformers: {
      before: [
        transformWithTs(ts, {
          additionalComponentNames: options.additionalComponentNames,
          additionalFunctionNames: options.additionalFunctionNames,
          flatten: false,
          onMsgDescriptorExtracted: (_file, occurrence) =>
            occurrences.push(occurrence),
          onMsgError: (_file, error) => errors.push(error.message),
          preserveWhitespace: true,
          throws: false,
        }),
      ],
    },
  })
  for (const diagnostic of result.diagnostics || []) {
    if (diagnostic.category === ts.DiagnosticCategory.Error) {
      errors.push(formatDiagnostic(diagnostic))
    }
  }
  return {occurrences, errors}
}

function validateMessages(
  messages: Readonly<Record<string, string>>
): Map<string, ReturnType<typeof parse>> {
  if (!messages || typeof messages !== 'object' || Array.isArray(messages)) {
    throw new Error('The source catalog must compile to an object of messages.')
  }
  const parsed = new Map<string, ReturnType<typeof parse>>()
  for (const [id, message] of Object.entries(messages)) {
    if (typeof message !== 'string') {
      throw new Error(`Source message "${id}" must be a string.`)
    }
    try {
      parsed.set(id, parse(message))
    } catch (error) {
      throw new Error(
        `Invalid ICU message for "${id}": ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }
  return parsed
}

function applyChanges(source: string, changes: PlannedChange[]): string {
  let result = source
  for (const change of [...changes].sort((a, b) => b.start - a.start)) {
    result =
      result.slice(0, change.start) +
      change.replacement +
      result.slice(change.end)
  }
  return result
}

export async function syncSource(
  files: readonly string[],
  messages: Readonly<Record<string, string>>,
  options: SyncSourceOptions = {}
): Promise<SyncSourceResult> {
  const parsedMessages = validateMessages(messages)
  const plans: FilePlan[] = []
  const problems: string[] = []
  const warnings: SyncSourceDiagnostic[] = []

  for (const file of [...new Set(files)].sort()) {
    options.signal?.throwIfAborted()
    if (!SUPPORTED_EXTENSIONS.has(extname(file).toLowerCase())) {
      problems.push(
        `${file}: sync-source only supports JavaScript and TypeScript files.`
      )
      continue
    }
    const source = await readFile(file, {
      encoding: 'utf8',
      signal: options.signal,
    })
    const scan = scanFile(file, source, options)
    problems.push(...scan.errors)
    const changes: PlannedChange[] = []
    const ranges = new Map<string, PlannedChange>()

    for (const occurrence of scan.occurrences) {
      const {descriptor, locations} = occurrence
      const id = descriptor.id
      if (!id) {
        warnings.push({
          file,
          message: 'Skipped a message without a static explicit ID.',
        })
        continue
      }
      if (!locations.id) {
        problems.push(
          `${file}: message "${id}" does not have a writable static ID.`
        )
        continue
      }
      if (!Object.prototype.hasOwnProperty.call(messages, id)) {
        continue
      }
      const next = messages[id]
      const previous =
        locations.defaultMessage?.value ?? descriptor.defaultMessage
      if (previous === next) {
        continue
      }
      if (previous == null || !locations.defaultMessage) {
        problems.push(
          `${file}: message "${id}" does not have a writable static defaultMessage.`
        )
        continue
      }
      let previousAst: ReturnType<typeof parse>
      try {
        previousAst = parse(previous)
      } catch (error) {
        problems.push(
          `${file}: current defaultMessage for "${id}" is invalid ICU: ${error instanceof Error ? error.message : String(error)}`
        )
        continue
      }
      const structuralResult = isStructurallySame(
        previousAst,
        parsedMessages.get(id)!
      )
      if (!structuralResult.success) {
        problems.push(
          `${file}: source message "${id}" changes ICU structure: ${structuralResult.error?.message || 'unknown structural difference'}`
        )
        continue
      }
      const position = sourcePosition(source, locations.defaultMessage.start)
      const change: PlannedChange = {
        file,
        id,
        ...position,
        previous,
        next,
        start: locations.defaultMessage.start,
        end: locations.defaultMessage.end,
        replacement: replacementFor(source, locations.defaultMessage, next),
      }
      const rangeKey = `${change.start}:${change.end}`
      const existing = ranges.get(rangeKey)
      if (existing && existing.replacement !== change.replacement) {
        problems.push(
          `${file}: conflicting updates target the same source range.`
        )
        continue
      }
      if (!existing) {
        ranges.set(rangeKey, change)
        changes.push(change)
      }
    }

    const ordered = [...changes].sort((a, b) => a.start - b.start)
    for (let i = 1; i < ordered.length; i++) {
      if (ordered[i - 1].end > ordered[i].start) {
        problems.push(`${file}: overlapping source updates are not supported.`)
      }
    }
    if (changes.length) {
      plans.push({file, source, changes})
    }
  }

  if (problems.length) {
    throw new Error(`Unable to sync source messages:\n${problems.join('\n')}`)
  }

  options.signal?.throwIfAborted()
  if (options.write) {
    await Promise.all(
      plans.map(plan =>
        writeFile(plan.file, applyChanges(plan.source, plan.changes), 'utf8')
      )
    )
  }

  return {
    changes: plans.flatMap(plan =>
      plan.changes.map(
        ({start: _start, end: _end, replacement: _replacement, ...change}) =>
          change
      )
    ),
    changedFiles: plans.map(plan => plan.file),
    warnings,
  }
}

export async function syncSourceFromFile(
  files: readonly string[],
  options: SyncSourceFileOptions
): Promise<SyncSourceResult> {
  const {sourceFile, format = 'simple', ...syncOptions} = options
  if (!SYNC_SOURCE_FORMATS.has(format)) {
    throw new Error(`Unsupported source catalog format "${format}".`)
  }
  syncOptions.signal?.throwIfAborted()
  const catalogSource = await readFile(sourceFile, {
    encoding: 'utf8',
    signal: syncOptions.signal,
  })
  let rawCatalog: unknown
  try {
    rawCatalog = JSON.parse(catalogSource)
  } catch (error) {
    throw new Error(
      `Cannot parse source catalog "${sourceFile}": ${error instanceof Error ? error.message : String(error)}`
    )
  }
  const formatter: Formatter<unknown> = await resolveBuiltinFormatter(format)
  return syncSource(files, formatter.compile(rawCatalog), syncOptions)
}

export default syncSourceFromFile
