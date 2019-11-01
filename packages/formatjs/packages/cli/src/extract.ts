import {ExtractedMessageDescriptor} from 'babel-plugin-react-intl/dist';
import {OptionsSchema} from 'babel-plugin-react-intl/dist/options';
import * as babel from '@babel/core';
import {warn, getStdinAsString} from './console_utils';
import keyBy from 'lodash/keyBy';
import {extname} from 'path';
import {outputJSONSync} from 'fs-extra';
import {interpolateName} from 'loader-utils';

export type ExtractCLIOptions = Omit<OptionsSchema, 'overrideIdFn'> & {
  outFile?: string;
  idInterpolationPattern?: string;
};

function getBabelConfig(
  filename: string,
  reactIntlOptions: ExtractCLIOptions,
  extraBabelOptions: Partial<babel.TransformOptions> = {}
): babel.TransformOptions {
  const fileExt = extname(filename);
  const isTS = fileExt === '.ts';
  const isTSX = fileExt === '.tsx';
  return {
    babelrc: false,
    parserOpts: {
      plugins: ['jsx'],
    },
    presets: [
      ...(isTS || isTSX
        ? [['@babel/preset-typescript', {isTSX, allExtensions: true}]]
        : []),
      [
        '@babel/preset-env',
        {
          targets: {
            esmodules: true,
          },
        },
      ],
    ],
    // We need to use require.resolve here, or otherwise the lookup is based on the current working
    // directory of the CLI.
    plugins: [
      '@babel/plugin-proposal-class-properties',
      // We want to make sure that `const enum` does not throw an error.
      ...(isTS || isTSX ? [require.resolve('babel-plugin-const-enum')] : []),
      [require.resolve('babel-plugin-react-intl'), reactIntlOptions],
    ],
    highlightCode: true,
    // Extraction of string messages does not output the transformed JavaScript.
    sourceMaps: false,
    ...extraBabelOptions,
  };
}

function extractSingleFile(
  filename: string,
  extractOptions: ExtractCLIOptions
): babel.BabelFileResult | null {
  return babel.transformFileSync(
    filename,
    getBabelConfig(filename, extractOptions, {filename})
  );
}

function getReactIntlMessages(
  babelResult: babel.BabelFileResult | null
): Record<string, ExtractedMessageDescriptor> {
  if (babelResult === null) {
    return {};
  } else {
    const messages: ExtractedMessageDescriptor[] = (babelResult.metadata as any)[
      'react-intl'
    ].messages;
    return keyBy(messages, 'id');
  }
}

export default async function extract(
  files: readonly string[],
  {outFile, idInterpolationPattern, ...extractOpts}: ExtractCLIOptions
) {
  let babelOpts: OptionsSchema = extractOpts;
  if (outFile) {
    babelOpts.messagesDir = undefined;
  }
  const printMessagesToStdout = babelOpts.messagesDir == null && !outFile;
  let extractedMessages: Record<string, ExtractedMessageDescriptor> = {};

  if (files.length > 0) {
    for (const file of files) {
      if (idInterpolationPattern) {
        babelOpts = {
          ...babelOpts,
          overrideIdFn: (id, defaultMessage, description) =>
            id ||
            interpolateName(
              {
                resourcePath: file,
              } as any,
              idInterpolationPattern,
              {content: `${defaultMessage}#${description}`}
            ),
        };
      }
      const babelResult = extractSingleFile(file, babelOpts);
      const singleFileExtractedMessages = getReactIntlMessages(babelResult);
      // Aggregate result when we have to output to a single file
      if (outFile || printMessagesToStdout) {
        Object.assign(extractedMessages, singleFileExtractedMessages);
      }
    }
  } else {
    if (files.length === 0 && process.stdin.isTTY) {
      warn('Reading source file from TTY.');
    }
    if (idInterpolationPattern) {
      babelOpts = {
        ...babelOpts,
        overrideIdFn: (id, defaultMessage, description) =>
          id ||
          interpolateName(
            {
              resourcePath: 'dummy',
            } as any,
            idInterpolationPattern,
            {content: `${defaultMessage}#${description}`}
          ),
      };
    }
    const stdinSource = await getStdinAsString();
    const babelResult = babel.transformSync(
      stdinSource,
      getBabelConfig('<stdin>', babelOpts)
    );
    if (printMessagesToStdout) {
      extractedMessages = getReactIntlMessages(babelResult);
    }
  }
  if (outFile) {
    outputJSONSync(outFile, Object.values(extractedMessages), {
      spaces: 2,
    });
  }
  if (printMessagesToStdout) {
    process.stdout.write(
      JSON.stringify(Object.values(extractedMessages), null, 2)
    );
    process.stdout.write('\n');
  }
}
