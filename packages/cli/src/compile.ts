import {parse, MessageFormatElement} from 'intl-messageformat-parser';
import {outputFileSync, readJSONSync} from 'fs-extra';
import * as stringify from 'json-stable-stringify';
import {resolveBuiltinFormatter} from './formatters';

export type CompileFn = (msgs: any) => Record<string, string>;

export interface CompileCLIOpts extends Opts {
  outFile?: string;
}
export interface Opts {
  ast?: boolean;
  format?: string;
}
export default function compile(
  inputFile: string,
  outFile?: string,
  {ast, format}: Opts = {}
) {
  const formatter = resolveBuiltinFormatter(format);

  const messages: Record<string, string> = formatter.compile(
    readJSONSync(inputFile)
  );
  const results: Record<string, string | MessageFormatElement[]> = {};

  for (const [id, message] of Object.entries(messages)) {
    // Parse so we can verify that the message is not malformed
    const msgAst = parse(message);
    results[id] = ast ? msgAst : message;
  }
  const serializedResult = stringify(results, {
    space: 2,
    cmp: formatter.compareMessages || undefined,
  });
  if (!outFile) {
    process.stdout.write(serializedResult);
    process.stdout.write('\n');
  } else {
    outputFileSync(outFile, serializedResult);
  }
}
