import {transformWithTs, Opts} from '.'
export const name = '@formatjs/ts-transformer'
export const version = '2.10.1'

export function factory(cs: any, opts: Opts = {}) {
  return transformWithTs(cs.compilerModule, opts)
}
