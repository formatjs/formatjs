import {warn, getStdinAsString} from './console_utils';
import {outputJSONSync, readFile} from 'fs-extra';
import {
  interpolateName,
  transform,
  Opts,
  MessageDescriptor,
} from '@formatjs/ts-transformer';
import {IOptions as GlobOptions} from 'glob';
import * as ts from 'typescript';

export interface ExtractionResult<M = Record<string, string>> {
  messages: MessageDescriptor[];
  meta: M;
}

export type ExtractCLIOptions = Omit<
  ExtractOptions,
  'overrideIdFn' | 'onMsgExtracted' | 'onMetaExtracted'
> & {
  outFile?: string;
  ignore?: GlobOptions['ignore'];
};

export type ExtractOptions = Opts & {
  throws?: boolean;
  idInterpolationPattern?: string;
  readFromStdin?: boolean;
} & Pick<Opts, 'onMsgExtracted' | 'onMetaExtracted'>;

function processFile(
  source: string,
  fn: string,
  {idInterpolationPattern, ...opts}: Opts & {idInterpolationPattern?: string}
) {
  let messages: MessageDescriptor[] = [];
  let meta: Record<string, string> = {};
  if (!opts.overrideIdFn && idInterpolationPattern) {
    opts = {
      ...opts,
      overrideIdFn: (id, defaultMessage, description, fileName) =>
        id ||
        interpolateName(
          {
            resourcePath: fileName,
          } as any,
          idInterpolationPattern,
          {
            content: description
              ? `${defaultMessage}#${description}`
              : defaultMessage,
          }
        ),
      onMsgExtracted(_, msgs) {
        messages = messages.concat(msgs);
      },
      onMetaExtracted(_, m) {
        meta = m;
      },
    };
  }

  ts.transpileModule(source, {
    compilerOptions: {
      allowJs: true,
      target: ts.ScriptTarget.ESNext,
      noEmit: true,
    },
    fileName: fn,
    transformers: {
      before: [transform(opts)],
    },
  });
  return {messages, meta};
}

export async function extract(
  files: readonly string[],
  {throws, readFromStdin, ...opts}: ExtractOptions
): Promise<ExtractionResult[]> {
  if (readFromStdin) {
    // Read from stdin
    if (process.stdin.isTTY) {
      warn('Reading source file from TTY.');
    }
    const stdinSource = await getStdinAsString();
    return [processFile(stdinSource, 'dummy', opts)];
  }

  const results = await Promise.all(
    files.map(async fn => {
      try {
        const source = await readFile(fn, 'utf8');
        return processFile(source, fn, opts);
      } catch (e) {
        if (throws) {
          throw e;
        } else {
          warn(e);
        }
      }
    })
  );

  return results.filter((r): r is ExtractionResult => !!r);
}

export default async function extractAndWrite(
  files: readonly string[],
  opts: ExtractCLIOptions
) {
  const {outFile, throws, ...extractOpts} = opts;
  const extractionResults = await extract(files, extractOpts);
  const printMessagesToStdout = !outFile;
  const extractedMessages = new Map<string, MessageDescriptor>();

  for (const {messages} of extractionResults) {
    for (const message of messages) {
      const {id, description, defaultMessage} = message;
      if (!id) {
        const error = new Error(
          `[FormatJS CLI] Missing message id for message: 
${JSON.stringify(message, undefined, 2)}`
        );
        if (throws) {
          throw error;
        } else {
          warn(error.message);
        }
        continue;
      }

      if (extractedMessages.has(id)) {
        const existing = extractedMessages.get(id)!;
        if (
          description !== existing.description ||
          defaultMessage !== existing.defaultMessage
        ) {
          const error = new Error(
            `[FormatJS CLI] Duplicate message id: "${id}", ` +
              'but the `description` and/or `defaultMessage` are different.'
          );
          if (throws) {
            throw error;
          } else {
            warn(error.message);
          }
        }
      }
      extractedMessages.set(id, message);
    }
  }
  const results: Record<string, Omit<MessageDescriptor, 'id'>> = {};
  const messages = Array.from(extractedMessages.values());
  for (const {id, ...msg} of messages) {
    results[id] = msg;
  }

  if (outFile) {
    outputJSONSync(outFile, results, {
      spaces: 2,
    });
  }
  if (printMessagesToStdout) {
    process.stdout.write(JSON.stringify(results, null, 2));
    process.stdout.write('\n');
  }
}
