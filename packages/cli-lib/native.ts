import {readFileSync} from 'node:fs'
import {parse, resolve, sep} from 'node:path'
import {createRequire} from 'module'
import {Runfiles} from '@bazel/runfiles'
import type * as emnapiCore from '@emnapi/core'
import type * as emnapiPlugins from '@emnapi/core/plugins'
import type * as emnapiRuntime from '@emnapi/runtime'
import type * as nodeWasi from 'node:wasi'
import type {
  EvaluationSpan,
  EvaluatedString,
} from '#packages/cli-lib/static-evaluation.js'

const require = createRequire(import.meta.url)

const NATIVE_PACKAGES: Record<string, string[]> = {
  'darwin-arm64': ['@formatjs/cli-native-darwin-arm64'],
  'darwin-x64': ['@formatjs/cli-native-darwin-x64'],
  'freebsd-x64': ['@formatjs/cli-native-freebsd-x64'],
  'linux-arm64': [
    '@formatjs/cli-native-linux-arm64',
    '@formatjs/cli-native-linux-arm64-musl',
  ],
  'linux-x64': [
    '@formatjs/cli-native-linux-x64',
    '@formatjs/cli-native-linux-x64-musl',
  ],
  'win32-x64': ['@formatjs/cli-native-win32-x64'],
  'win32-arm64': ['@formatjs/cli-native-win32-arm64'],
}

export interface NativeCompileOptions {
  ast?: boolean
  format?: string
  ignoreTag?: boolean
  pseudoLocale?: string
  skipErrors?: boolean
  followLinks?: boolean
}

export interface NativeCompileMessage {
  id: string
  message: string
  sourceFile: string
}

export interface NativeExtractOptions {
  additionalComponentNames?: string[]
  additionalFunctionNames?: string[]
  extractSourceLocation?: boolean
  flatten?: boolean
  followLinks?: boolean
  format?: string
  idInterpolationPattern?: string
  ignore?: string[]
  inFile?: string
  pragma?: string
  preserveWhitespace?: boolean
  throws?: boolean
}

export interface NativeExtractSourceInput {
  filename: string
  source: string
}

export interface NativeMessageDescriptor {
  id?: string
  defaultMessage?: string
  description?: string | object
  file?: string
  start?: number
  end?: number
}

export interface NativeExtractSourceResult {
  filename: string
  messages: NativeMessageDescriptor[]
  meta?: Record<string, string>
  errors?: string[]
}

export interface NativeExtractSourcesResult {
  files: NativeExtractSourceResult[]
  warnings?: string[]
}

export interface NativeBinding {
  evaluateStrings(
    source: string,
    filename: string,
    spans: EvaluationSpan[]
  ): EvaluatedString[]
  compile(inputFiles: string[], opts?: NativeCompileOptions): string
  compileMessages(
    messages: NativeCompileMessage[],
    opts?: NativeCompileOptions
  ): string
  extract(inputFiles: string[], opts?: NativeExtractOptions): string
  extractSources(
    sources: NativeExtractSourceInput[],
    opts?: NativeExtractOptions,
    generateIds?: boolean
  ): string
  generateId(
    pattern: string,
    defaultMessage?: string,
    descriptionJson?: string,
    filename?: string
  ): string
  verifyJavaPrintf(catalogsJson: string, sourceLocale: string): string
  verifyAppleResources(
    resources: {filename: string; content: Buffer}[],
    sourceLocale: string | undefined,
    missingKeys: boolean,
    extraKeys: boolean,
    structuralEquality: boolean
  ): string
  verifyAndroidResources(
    resources: {filename: string; content: Buffer}[],
    sourceLocale: string | undefined,
    missingKeys: boolean,
    extraKeys: boolean,
    structuralEquality: boolean
  ): string
  verifyXcstrings(
    catalogsJson: string,
    sourceLocale: string | undefined,
    missingKeys: boolean,
    structuralEquality: boolean
  ): string
  supportedBuiltinFormatters(): string[]
}

let nativeBinding: NativeBinding | undefined

function loadWasi(): NativeBinding {
  const {WASI} = require('node:wasi') as typeof nodeWasi
  const {instantiateAddonSync} = require('@emnapi/core') as typeof emnapiCore
  const {asyncWork, tsfn} =
    require('@emnapi/core/plugins') as typeof emnapiPlugins
  const {getDefaultContext} = require('@emnapi/runtime') as typeof emnapiRuntime
  // Map host paths to the preopened WASI root.
  const root = parse(process.cwd()).root
  const wasi = new WASI({
    version: 'preview1',
    preopens: {'/': root},
  })
  const wasmPath = require.resolve('./formatjs_cli.wasm')
  const binding = instantiateAddonSync(readFileSync(wasmPath), {
    context: getDefaultContext(),
    wasi,
    plugins: [asyncWork, tsfn],
    overwriteImports(imports) {
      return {
        ...imports,
        env: {...imports.env, ...imports.napi, ...imports.emnapi},
      }
    },
    beforeInit({instance}) {
      for (const [name, register] of Object.entries(instance.exports)) {
        if (
          name.startsWith('__napi_register__') &&
          typeof register === 'function'
        ) {
          register()
        }
      }
    },
  }).addonModule.exports as NativeBinding

  return {
    ...binding,
    compile(files, options) {
      return binding.compile(
        files.map(file => {
          const absolute = resolve(file)
          if (parse(absolute).root.toLowerCase() !== root.toLowerCase()) {
            throw new Error(`WASI cannot read files outside ${root}: ${file}`)
          }
          return '/' + absolute.slice(root.length).split(sep).join('/')
        }),
        options
      )
    },
  }
}

export function getInstalledNativePackageCandidates(
  candidates: readonly string[],
  canResolve = (candidate: string): boolean => {
    try {
      require.resolve(candidate)
      return true
    } catch {
      return false
    }
  }
): string[] {
  return candidates.filter(canResolve)
}

export function getNativePackageCandidates(
  platform: NodeJS.Platform = process.platform,
  arch: string = process.arch
): string[] {
  const platformArch = `${platform}-${arch}`
  return NATIVE_PACKAGES[platformArch] || []
}

export function loadNative(): NativeBinding {
  if (nativeBinding) {
    return nativeBinding
  }

  const loadErrors: string[] = []
  if (process.env.FORMATJS_FORCE_WASI !== '1') {
    const binding = tryLoadNative(loadErrors)
    if (binding) {
      nativeBinding = binding
      return binding
    }
  }

  try {
    nativeBinding = loadWasi()
    return nativeBinding
  } catch (error) {
    loadErrors.push(`WASI: ${(error as Error).message}`)
    throw new Error(
      `@formatjs/cli-lib binding is unavailable.\n${loadErrors.join('\n')}`
    )
  }
}

function tryLoadNative(loadErrors: string[]): NativeBinding | undefined {
  let runfilesPath: string | undefined
  if (
    process.env.RUNFILES_DIR ||
    process.env.RUNFILES_MANIFEST_FILE ||
    process.env.RUNFILES
  ) {
    try {
      runfilesPath = new Runfiles().resolveWorkspaceRelative(
        'packages/cli-lib/formatjs_cli_napi.node'
      )
    } catch {
      // Published packages use platform-specific npm packages.
    }
  }
  const packageCandidates = getNativePackageCandidates()
  const installedPackageCandidates =
    getInstalledNativePackageCandidates(packageCandidates)
  const candidates = [
    runfilesPath,
    ...(installedPackageCandidates.length
      ? installedPackageCandidates
      : packageCandidates),
  ].filter(Boolean) as string[]
  for (const candidate of candidates) {
    try {
      return require(candidate) as NativeBinding
    } catch (e) {
      loadErrors.push(`${candidate}: ${(e as Error).message}`)
    }
  }
}

export function compileWithNative(
  inputFiles: string[],
  opts: NativeCompileOptions = {}
): string {
  const native = loadNative()
  return native.compile(inputFiles, {
    ast: opts.ast,
    format: opts.format,
    followLinks: opts.followLinks,
    ignoreTag: opts.ignoreTag,
    pseudoLocale: opts.pseudoLocale,
    skipErrors: opts.skipErrors,
  })
}

export function compileMessagesWithNative(
  messages: NativeCompileMessage[],
  opts: NativeCompileOptions = {}
): string {
  const native = loadNative()
  return native.compileMessages(messages, {
    ast: opts.ast,
    ignoreTag: opts.ignoreTag,
    pseudoLocale: opts.pseudoLocale,
    skipErrors: opts.skipErrors,
  })
}

export function extractSourcesWithNative(
  sources: NativeExtractSourceInput[],
  opts: NativeExtractOptions = {},
  generateIds = true
): NativeExtractSourcesResult {
  const native = loadNative()
  return JSON.parse(native.extractSources(sources, opts, generateIds))
}

export function generateIdWithNative(
  pattern: string,
  defaultMessage?: string,
  description?: string | object,
  filename?: string
): string {
  return loadNative().generateId(
    pattern,
    defaultMessage,
    description === undefined ? undefined : JSON.stringify(description),
    filename
  )
}

export interface NativeVerificationIssue {
  locale: string
  messageId: string
  error: string
}

export function verifyJavaPrintfWithNative(
  catalogs: Record<string, unknown>,
  sourceLocale: string
): NativeVerificationIssue[] {
  const native = loadNative()
  if (typeof native.verifyJavaPrintf !== 'function') {
    throw new Error(
      'Installed FormatJS native package does not support Java printf verification; update @formatjs/cli and its native package.'
    )
  }
  return JSON.parse(
    native.verifyJavaPrintf(JSON.stringify(catalogs), sourceLocale)
  )
}

export function verifyAppleResourcesWithNative(
  resources: {filename: string; content: Buffer}[],
  sourceLocale: string | undefined,
  missingKeys: boolean,
  extraKeys: boolean,
  structuralEquality: boolean
): NativeVerificationIssue[] {
  const native = loadNative()
  if (typeof native.verifyAppleResources !== 'function') {
    throw new Error(
      'Installed FormatJS native package does not support Apple resource verification; update @formatjs/cli and its native package.'
    )
  }
  return JSON.parse(
    native.verifyAppleResources(
      resources,
      sourceLocale,
      missingKeys,
      extraKeys,
      structuralEquality
    )
  )
}

export function verifyAndroidResourcesWithNative(
  resources: {filename: string; content: Buffer}[],
  sourceLocale: string | undefined,
  missingKeys: boolean,
  extraKeys: boolean,
  structuralEquality: boolean
): NativeVerificationIssue[] {
  const native = loadNative()
  if (typeof native.verifyAndroidResources !== 'function') {
    throw new Error(
      'Installed FormatJS native package does not support Android resource verification; update @formatjs/cli and its native package.'
    )
  }
  return JSON.parse(
    native.verifyAndroidResources(
      resources,
      sourceLocale,
      missingKeys,
      extraKeys,
      structuralEquality
    )
  )
}
