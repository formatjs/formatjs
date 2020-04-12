import {ExtractionResult, OptionsSchema} from 'babel-plugin-react-intl';
import * as babel from '@babel/core';
import {warn, getStdinAsString} from './console_utils';
import {outputJSONSync} from 'fs-extra';
import {interpolateName} from 'loader-utils';
import {IOptions as GlobOptions} from 'glob';

export type ExtractCLIOptions = Omit<ExtractOptions, 'overrideIdFn'> & {
  outFile?: string;
  ignore?: GlobOptions['ignore'];
};

export type ExtractOptions = OptionsSchema & {
  throws?: boolean;
  idInterpolationPattern?: string;
  readFromStdin?: boolean;
};

function getBabelConfig(
  reactIntlOptions: ExtractCLIOptions,
  extraBabelOptions: Partial<babel.TransformOptions> = {}
): babel.TransformOptions {
  return {
    babelrc: false,
    configFile: false,
    parserOpts: {
      plugins: [
        'asyncGenerators',
        'bigInt',
        'classPrivateMethods',
        'classPrivateProperties',
        'classProperties',
        'decorators-legacy',
        'doExpressions',
        'dynamicImport',
        'exportDefaultFrom',
        'functionBind',
        'functionSent',
        'importMeta',
        'jsx',
        'logicalAssignment',
        'nullishCoalescingOperator',
        'numericSeparator',
        'objectRestSpread',
        'optionalCatchBinding',
        'optionalChaining',
        'partialApplication',
        'placeholders',
        'throwExpressions',
        'topLevelAwait',
        'typescript',
      ],
    },
    // We need to use require.resolve here, or otherwise the lookup is based on the current working
    // directory of the CLI.
    plugins: [[require.resolve('babel-plugin-react-intl'), reactIntlOptions]],
    highlightCode: true,
    // Extraction of string messages does not output the transformed JavaScript.
    sourceMaps: false,
    ...extraBabelOptions,
  };
}

export async function extract(
  files: readonly string[],
  {idInterpolationPattern, throws, readFromStdin, ...babelOpts}: ExtractOptions
): Promise<ExtractionResult[]> {
  if (readFromStdin) {
    // Read from stdin
    if (process.stdin.isTTY) {
      warn('Reading source file from TTY.');
    }
    if (!babelOpts.overrideIdFn && idInterpolationPattern) {
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
      getBabelConfig(babelOpts)
    );

    return [
      ((babelResult as babel.BabelFileResult).metadata as any)[
        'react-intl'
      ] as ExtractionResult,
    ];
  }

  const results = await Promise.all(
    files.map(filename => {
      if (!babelOpts.overrideIdFn && idInterpolationPattern) {
        babelOpts = {
          ...babelOpts,
          overrideIdFn: (id, defaultMessage, description) =>
            id ||
            interpolateName(
              {
                resourcePath: filename,
              } as any,
              idInterpolationPattern,
              {content: `${defaultMessage}#${description}`}
            ),
        };
      }
      const promise = babel.transformFileAsync(
        filename,
        getBabelConfig(babelOpts, {filename: filename})
      );
      return throws ? promise : promise.catch(e => warn(e));
    })
  );
  return results
    .filter(r => r && r.metadata)
    .map(
      r =>
        ((r as babel.BabelFileResult).metadata as any)[
          'react-intl'
        ] as ExtractionResult
    );
}

export default async function extractAndWrite(
  files: readonly string[],
  opts: ExtractCLIOptions
) {
  const {outFile, ...extractOpts} = opts;
  if (outFile) {
    extractOpts.messagesDir = undefined;
  }
  const extractionResults = await extract(files, extractOpts);
  const printMessagesToStdout = extractOpts.messagesDir == null && !outFile;
  const extractedMessages = extractionResults
    .map(m => m.messages)
    .filter(Boolean)
    .reduce((all, messages) => [...all, ...messages], []);
  if (outFile) {
    outputJSONSync(outFile, extractedMessages, {
      spaces: 2,
    });
  }
  if (printMessagesToStdout) {
    process.stdout.write(JSON.stringify(extractedMessages, null, 2));
    process.stdout.write('\n');
  }
}
