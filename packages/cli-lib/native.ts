import {createRequire} from 'module'

const require = createRequire(import.meta.url)

const NATIVE_PACKAGES: Record<string, string[]> = {
  'darwin-arm64': ['@formatjs/cli-native-darwin-arm64'],
  'linux-arm64': [
    '@formatjs/cli-native-linux-arm64',
    '@formatjs/cli-native-linux-arm64-musl',
  ],
  'linux-x64': [
    '@formatjs/cli-native-linux-x64',
    '@formatjs/cli-native-linux-x64-musl',
  ],
  'win32-x64': ['@formatjs/cli-native-win32-x64'],
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

export interface NativeBinding {
  compile(inputFiles: string[], opts?: NativeCompileOptions): string
  compileMessages(
    messages: NativeCompileMessage[],
    opts?: NativeCompileOptions
  ): string
  extract(inputFiles: string[], opts?: NativeExtractOptions): string
  supportedBuiltinFormatters(): string[]
}

let nativeBinding: NativeBinding | null | undefined

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
  if (nativeBinding !== undefined) {
    if (nativeBinding) {
      return nativeBinding
    }
    throw new Error('Native @formatjs/cli-lib binding is unavailable')
  }

  const overridePath = process.env.FORMATJS_CLI_LIB_NATIVE_PATH
  const packageCandidates = getNativePackageCandidates()
  const installedPackageCandidates =
    getInstalledNativePackageCandidates(packageCandidates)
  const candidates = [
    overridePath,
    ...(installedPackageCandidates.length
      ? installedPackageCandidates
      : packageCandidates),
  ].filter(Boolean) as string[]
  const loadErrors: string[] = []

  for (const candidate of candidates) {
    try {
      nativeBinding = require(candidate) as NativeBinding
      return nativeBinding
    } catch (e) {
      loadErrors.push(`${candidate}: ${(e as Error).message}`)
    }
  }

  nativeBinding = null
  throw new Error(
    `Native @formatjs/cli-lib binding is unavailable.\n${loadErrors.join('\n')}`
  )
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

export function extractWithNative(
  inputFiles: readonly string[],
  opts: NativeExtractOptions = {}
): string {
  const native = loadNative()
  return native.extract([...inputFiles], {
    additionalComponentNames: opts.additionalComponentNames,
    additionalFunctionNames: opts.additionalFunctionNames,
    extractSourceLocation: opts.extractSourceLocation,
    flatten: opts.flatten,
    followLinks: opts.followLinks,
    format: opts.format,
    idInterpolationPattern: opts.idInterpolationPattern,
    ignore: opts.ignore,
    inFile: opts.inFile,
    pragma: opts.pragma,
    preserveWhitespace: opts.preserveWhitespace,
    throws: opts.throws,
  })
}
