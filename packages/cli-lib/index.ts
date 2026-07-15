export {default as extractAndWrite, extract} from '#packages/cli-lib/extract.js'
export type {ExtractCLIOptions, ExtractOpts} from '#packages/cli-lib/extract.js'
export {
  default as syncSourceFromFile,
  syncSource,
} from '#packages/cli-lib/sync_source.js'
export type {
  SyncSourceChange,
  SyncSourceDiagnostic,
  SyncSourceFileOptions,
  SyncSourceFormat,
  SyncSourceOptions,
  SyncSourceResult,
} from '#packages/cli-lib/sync_source.js'
export type {MessageDescriptor} from '@formatjs/ts-transformer'
export type {FormatFn, CompileFn} from '#packages/cli-lib/formatters/default.js'
export type {Comparator} from 'json-stable-stringify'
export {default as compileAndWrite, compile} from '#packages/cli-lib/compile.js'
export type {
  CompileCLIOpts,
  Opts as CompileOpts,
} from '#packages/cli-lib/compile.js'
