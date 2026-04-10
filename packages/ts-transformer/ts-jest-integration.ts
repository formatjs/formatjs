import type {TsCompilerInstance} from 'ts-jest'
import {type SourceFile, type TransformerFactory} from 'typescript'
import {type Opts, transformWithTs} from '#packages/ts-transformer/index.js'

export const name = '@formatjs/ts-transformer'
export const version = '2.10.1'

export function factory(
  compilerInstance: TsCompilerInstance,
  opts: Opts
): TransformerFactory<SourceFile> {
  return transformWithTs(compilerInstance.configSet.compilerModule, opts)
}
