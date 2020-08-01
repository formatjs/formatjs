import {MessageDescriptor} from '../..';

export type FormatFn<T = Record<string, MessageDescriptor>> = (
  msgs: Record<string, MessageDescriptor>
) => T;

export type CompileFn<T = Record<string, MessageDescriptor>> = (
  msgs: T
) => Record<string, string>;

export const format: FormatFn = msgs => msgs;

export const compile: CompileFn = msgs => {
  const results: Record<string, string> = {};
  for (const k in msgs) {
    results[k] = msgs[k].defaultMessage!;
  }
  return results;
};
