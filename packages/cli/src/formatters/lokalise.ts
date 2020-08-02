import {FormatFn, CompileFn} from '../..';

export type StructuredJson = Record<
  string,
  {
    translation: string;
    notes?: string;
    context?: string;
    limit?: string;
  }
>;

export const format: FormatFn<StructuredJson> = msgs => {
  const results: StructuredJson = {};
  for (const [id, msg] of Object.entries(msgs)) {
    results[id] = {
      translation: msg.defaultMessage!,
      notes: msg.description,
    };
  }
  return results;
};

export const compile: CompileFn<StructuredJson> = msgs => {
  const results: Record<string, string> = {};
  for (const [id, msg] of Object.entries(msgs)) {
    results[id] = msg.translation;
  }
  return results;
};
