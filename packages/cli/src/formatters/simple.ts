import {FormatFn, CompileFn} from '../..';

export type PhraseJson = Record<string, string>;

export const format: FormatFn<PhraseJson> = msgs => {
  return Object.keys(msgs).reduce((all: PhraseJson, k) => {
    all[k] = msgs[k].defaultMessage!;
    return all;
  }, {});
};

export const compile: CompileFn<PhraseJson> = msgs => msgs;
