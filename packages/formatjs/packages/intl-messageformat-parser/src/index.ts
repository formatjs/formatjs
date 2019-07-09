import { parse as pegParse, IParseOptions } from './parser';
import { Options, MessageFormatElement } from './types';
import { normalizeHashtagInPlural } from './normalize';
export * from './types';
export * from './parser';
export { printAST } from './printer';

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
