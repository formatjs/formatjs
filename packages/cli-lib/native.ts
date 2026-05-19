import {createRequire} from 'module'

const require = createRequire(import.meta.url)

const NATIVE_PACKAGES: Record<string, string> = {
  'darwin-arm64': '@formatjs/cli-native-darwin-arm64',
  'linux-arm64': '@formatjs/cli-native-linux-arm64',
  'linux-x64': '@formatjs/cli-native-linux-x64',
  'win32-x64': '@formatjs/cli-native-win32-x64',
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

export interface NativeBinding {
  compile(inputFiles: string[], opts?: NativeCompileOptions): string
  compileMessages(
    messages: NativeCompileMessage[],
    opts?: NativeCompileOptions
  ): string
  supportedBuiltinFormatters(): string[]
}

let nativeBinding: NativeBinding | null | undefined

export function loadNative(): NativeBinding {
  if (nativeBinding !== undefined) {
    if (nativeBinding) {
      return nativeBinding
    }
    throw new Error('Native @formatjs/cli-lib binding is unavailable')
  }

  const overridePath = process.env.FORMATJS_CLI_LIB_NATIVE_PATH
  const platformPackage = NATIVE_PACKAGES[`${process.platform}-${process.arch}`]
  const candidates = [overridePath, platformPackage].filter(Boolean) as string[]
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
