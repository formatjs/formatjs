import {parse, MessageFormatElement} from 'intl-messageformat-parser';
import {outputFile, readJSON} from 'fs-extra';
import * as stringify from 'json-stable-stringify';
import {resolveBuiltinFormatter} from './formatters';

export type CompileFn = (msgs: any) => Record<string, string>;

export interface CompileCLIOpts extends Opts {
  /**
   * The target file that contains compiled messages.
   */
  outFile?: string;
}
export interface Opts {
  /**
   * Whether to compile message into AST instead of just string
   */
  ast?: boolean;
  /**
   * Path to a formatter file that converts <translation_files> to
   * `Record<string, string>` so we can compile.
   */
  format?: string;
}

/**
 * Aggregate `inputFiles` into a single JSON blob and compile.
 * Also checks for conflicting IDs.
 * Then returns the serialized result as a `string` since key order
 * makes a difference in some vendor.
 * @param inputFiles Input files
 * @param opts Options
 * @returns serialized result in string format
 */
export async function compile(inputFiles: string[], opts: Opts = {}) {
  const {ast, format} = opts;
  const formatter = await resolveBuiltinFormatter(format);

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
  return stringify(results, {
    space: 2,
    cmp: formatter.compareMessages || undefined,
  });
}

/**
 * Aggregate `inputFiles` into a single JSON blob and compile.
 * Also checks for conflicting IDs and write output to `outFile`.
 * @param inputFiles Input files
 * @param compileOpts options
 * @returns A `Promise` that resolves if file was written successfully
 */
export default async function compileAndWrite(
  inputFiles: string[],
  compileOpts: CompileCLIOpts = {}
) {
  const {outFile, ...opts} = compileOpts;
  const serializedResult = await compile(inputFiles, opts);
  if (outFile) {
    return outputFile(outFile, serializedResult);
  }
  process.stdout.write(serializedResult);
  process.stdout.write('\n');
}
