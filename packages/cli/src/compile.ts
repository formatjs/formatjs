import {parse, MessageFormatElement} from 'intl-messageformat-parser';
import {outputJSONSync, readJSONSync} from 'fs-extra';
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
  const formatFn = resolveBuiltinFormatter(format).compile;
  const messages: Record<string, string> = formatFn(readJSONSync(inputFile));
  const results: Record<string, string | MessageFormatElement[]> = {};

  for (const [id, message] of Object.entries(messages)) {
    // Parse so we can verify that the message is not malformed
    const msgAst = parse(message);
    results[id] = ast ? msgAst : message;
  }

  if (!outFile) {
    process.stdout.write(JSON.stringify(results, null, 2));
    process.stdout.write('\n');
  } else {
    outputJSONSync(outFile, results, {
      spaces: 2,
    });
  }
}
