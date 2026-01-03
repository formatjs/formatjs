import {type CompileFn, type FormatFn} from './default.js'

export type PhraseJson = Record<string, string>

export const format: FormatFn<PhraseJson> = msgs => {
  return Object.keys(msgs).reduce((all: PhraseJson, k) => {
    all[k] = msgs[k].defaultMessage!
    return all
  }, {})
}

export const compile: CompileFn<PhraseJson> = msgs => msgs
