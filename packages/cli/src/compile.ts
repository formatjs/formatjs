import {parse, MessageFormatElement} from 'intl-messageformat-parser';
import {outputFileSync, readJSON} from 'fs-extra';
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
export default async function compile(
  inputFiles: string[],
  outFile?: string,
  {ast, format}: Opts = {}
) {
  const formatter = resolveBuiltinFormatter(format);

  const messages: Record<string, string> = {};
  const idsWithFileName: Record<string, string> = {};
  const compiledFiles = await Promise.all(
    inputFiles.map(f => readJSON(f).then(formatter.compile))
  );
  for (let i = 0; i < inputFiles.length; i++) {
    const inputFile = inputFiles[i];
    const compiled = compiledFiles[i];
    for (const id in compiled) {
      if (messages[id] && messages[id] !== compiled[id]) {
        throw new Error(`Conflicting ID "${id}" with different translation found in these 2 files:
ID: ${id}
Message from ${idsWithFileName[id]}: ${messages[id]}
Message from ${compiled[id]}: ${inputFile}
`);
      }
      messages[id] = compiled[id];
      idsWithFileName[id] = inputFile;
    }
  }
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
