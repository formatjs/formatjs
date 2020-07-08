import {pegParse, IParseOptions} from './src/parser';
import {Options, MessageFormatElement} from './src/types';
import {normalizeHashtagInPlural} from './src/normalize';
export * from './src/types';
export * from './src/parser';
export * from './src/skeleton';

export type ParseOptions = Options & IParseOptions;

export function parse(
  input: string,
  opts?: ParseOptions
): MessageFormatElement[] {
  const els = pegParse(input, opts);
  if (!opts || opts.normalizeHashtagInPlural !== false) {
    normalizeHashtagInPlural(els);
  }
  return els;
}
