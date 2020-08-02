import {FormatFn, CompileFn} from '../..';

export type SmartlingJson = Record<
  string,
  {
    message: string;
    description?: string;
  }
>;

export const format: FormatFn<SmartlingJson> = msgs => {
  const results: SmartlingJson = {};
  for (const [id, msg] of Object.entries(msgs)) {
    results[id] = {
      message: msg.defaultMessage!,
      description: msg.description,
    };
  }
  return results;
};

export const compile: CompileFn<SmartlingJson> = msgs => {
  const results: Record<string, string> = {};
  for (const [id, msg] of Object.entries(msgs)) {
    if (id === 'smartling') {
      continue;
    }
    results[id] = msg.message;
  }
  return results;
};
