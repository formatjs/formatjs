import {parse, MessageFormatElement} from 'intl-messageformat-parser';
import {MessageDescriptor} from '@formatjs/ts-transformer';
import {outputJSONSync,readJSONSync} from 'fs-extra';
export interface CompileCLIOpts extends Opts {
  outFile?: string;
}
export interface Opts {
  ast?: boolean;
}
export default function compile(
  inputFile: string,
  outFile?: string,
  {ast}: Opts = {}
) {
  const messages: Record<
    string,
    Omit<MessageDescriptor, 'id'>
  > = readJSONSync(inputFile);
  const results: Record<string, string | MessageFormatElement[]> = {};
  for (const [id, {defaultMessage = ''}] of Object.entries(messages)) {
    // Parse so we can verify that the message is not malformed
    const msgAst = parse(defaultMessage);
    results[id] = ast ? msgAst : defaultMessage;
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
