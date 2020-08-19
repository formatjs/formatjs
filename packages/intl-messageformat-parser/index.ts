import {pegParse, IParseOptions} from './src/parser';
import {Options, MessageFormatElement} from './src/types';
import {normalizeHashtagInPlural} from './src/normalize';
export * from './src/types';
export * from './src/parser';

export type ParseOptions = Options & IParseOptions;

export function parse(
  input: string,
  opts?: ParseOptions
): MessageFormatElement[] {
  opts = {
    normalizeHashtagInPlural: true,
    shouldParseSkeleton: true,
    ...(opts || {}),
  };
  const els = pegParse(input, opts);
  if (opts.normalizeHashtagInPlural) {
    normalizeHashtagInPlural(els);
  }
  return els;
}
