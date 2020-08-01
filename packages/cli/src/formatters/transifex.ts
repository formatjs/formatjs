import {FormatFn, CompileFn} from '../..';

type StructuredJson = Record<
  string,
  {
    string: string;
    developer_comment?: string;
    context?: string;
    character_limit?: string;
  }
>;

export const format: FormatFn<StructuredJson> = msgs => {
  const results: StructuredJson = {};
  for (const [id, msg] of Object.entries(msgs)) {
    results[id] = {
      string: msg.defaultMessage!,
      developer_comment: msg.description,
    };
  }
  return results;
};

export const compile: CompileFn<StructuredJson> = msgs => {
  const results: Record<string, string> = {};
  for (const [id, msg] of Object.entries(msgs)) {
    results[id] = msg.string;
  }
  return results;
};
