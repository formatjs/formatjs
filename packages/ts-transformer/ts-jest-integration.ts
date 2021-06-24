import {transformWithTs, Opts} from '.'
import type {TsCompilerInstance} from 'ts-jest/dist/types'

export const name = '@formatjs/ts-transformer'
export const version = '2.10.1'

export function factory(compilerInstance: TsCompilerInstance, opts: Opts) {
  return transformWithTs(compilerInstance.configSet ? compilerInstance.configSet.compilerModule : compilerInstance.compilerModule, opts)
}
