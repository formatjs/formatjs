import commander from 'commander';
import loudRejection from 'loud-rejection';
import extract, {ExtractCLIOptions} from './extract';
import compile, {CompileCLIOpts, Opts} from './compile';
import compileFolder from './compile_folder';
import {sync as globSync} from 'fast-glob';

const KNOWN_COMMANDS = ['extract'];

async function main(argv: string[]) {
  loudRejection();

  const version = require('../package.json').version;

  commander
    .version(version, '-v, --version')
    .usage('<command> [flags]')
    .action(command => {
      if (!KNOWN_COMMANDS.includes(command)) {
        commander.help();
      }
    });

  commander
    .command('help', {isDefault: true})
    .description('Show this help message.')
    .action(() => commander.help());

  // Long text wrapping to available terminal columns: https://github.com/tj/commander.js/pull/956
  // NOTE: please keep the help text in sync with babel-plugin-react-intl documentation.
  commander
    .command('extract [files...]')
    .description(
      `Extract string messages from React components that use react-intl.
The input language is expected to be TypeScript or ES2017 with JSX.`
    )
    .option(
      '--format <path>',
      `Path to a formatter file that controls the shape of JSON file from \`--out-file\`.
The formatter file must export a function called \`format\` with the signature
\`\`\`
type FormatFn = <T = Record<string, MessageDescriptor>>(
  msgs: Record<string, MessageDescriptor>
) => T
\`\`\` 
This is especially useful to convert from our extracted format to a TMS-specific format.
`
    )
    .option(
      '--out-file <path>',
      `The target file path where the plugin will output an aggregated 
\`.json\` file of all the translations from the \`files\` supplied.`
    )
    .option(
      '--id-interpolation-pattern <pattern>',
      `If certain message descriptors don't have id, this \`pattern\` will be used to automatically
generate IDs for them. Default to \`[contenthash:5]\` where \`contenthash\` is the hash of
\`defaultMessage\` and \`description\`.
See https://github.com/webpack/loader-utils#interpolatename for sample patterns`,
      '[contenthash:5]'
    )
    .option(
      '--extract-source-location',
      `Whether the metadata about the location of the message in the source file should be 
extracted. If \`true\`, then \`file\`, \`start\`, and \`end\` fields will exist for each 
extracted message descriptors.`,
      false
    )
    .option(
      '--remove-default-message',
      'Remove `defaultMessage` field in generated js after extraction',
      false
    )
    .option(
      '--additional-component-names <comma-separated-names>',
      `Additional component names to extract messages from, e.g: \`['FormattedFooBarMessage']\`. 
**NOTE**: By default we check for the fact that \`FormattedMessage\` 
is imported from \`moduleSourceName\` to make sure variable alias 
works. This option does not do that so it's less safe.`,
      (val: string) => val.split(',')
    )
    .option(
      '--extract-from-format-message-call',
      `Opt-in to extract from \`intl.formatMessage\` call with the same restrictions, e.g: has 
to be called with object literal such as \`intl.formatMessage({ id: 'foo', defaultMessage: 
'bar', description: 'baz'})`,
      true
    )
    .option(
      '--ignore <files...>',
      'List of glob paths to **not** extract translations from.'
    )
    .option(
      '--throws',
      'Whether to throw an exception when we fail to process any file in the batch.'
    )
    .option(
      '--pragma <pragma>',
      `parse specific additional custom pragma. This allows you to tag certain file with metadata such as \`project\`. For example with this file:

      \`\`\`
      // @intl-meta project:my-custom-project
      import {FormattedMessage} from 'react-intl';

      <FormattedMessage defaultMessage="foo" id="bar" />;
      \`\`\`

      and with option \`{pragma: "@intl-meta"}\`, we'll parse out \`// @intl-meta project:my-custom-project\` into \`{project: 'my-custom-project'}\` in the result file.`
    )
    .action(async (files: readonly string[], cmdObj: ExtractCLIOptions) => {
      const processedFiles = [];
      for (const f of files) {
        processedFiles.push(
          ...globSync(f, {
            ignore: cmdObj.ignore,
          })
        );
      }

      await extract(processedFiles, {
        outFile: cmdObj.outFile,
        idInterpolationPattern:
          cmdObj.idInterpolationPattern || '[sha1:contenthash:base64:6]',
        extractSourceLocation: cmdObj.extractSourceLocation,
        removeDefaultMessage: cmdObj.removeDefaultMessage,
        additionalComponentNames: cmdObj.additionalComponentNames,
        extractFromFormatMessageCall: cmdObj.extractFromFormatMessageCall,
        throws: cmdObj.throws,
        pragma: cmdObj.pragma,
        format: cmdObj.format,
        // It is possible that the glob pattern does NOT match anything.
        // But so long as the glob pattern is provided, don't read from stdin.
        readFromStdin: files.length === 0,
      });
      process.exit(0);
    });

  commander
    .command('compile <translation_files>')
    .description(
      `Compile extracted translation file into react-intl consumable JSON
We also verify that the messages are valid ICU and not malformed. 
<translation_files> can be a glob like "foo/**/en.json"`
    )
    .option(
      '--format <path>',
      `Path to a formatter file that converts \`<translation_file>\` to \`Record<string, string>\`
so we can compile. The file must export a function named \`compile\` with the signature:
\`\`\`
type CompileFn = <T = Record<string, MessageDescriptor>>(
  msgs: T
) => Record<string, string>;
\`\`\`
This is especially useful to convert from a TMS-specific format back to react-intl format
`
    )
    .option(
      '--out-file <path>',
      `Compiled translation output file.
If this is not provided, result will be printed to stdout`
    )
    .option(
      '--ast',
      `Whether to compile to AST. See https://formatjs.io/docs/guides/advanced-usage#pre-parsing-messages
for more information`
    )
    .action(async (filePattern: string, opts: CompileCLIOpts) => {
      const files = globSync(filePattern);
      if (!files.length) {
        throw new Error(`No input file found with pattern ${filePattern}`);
      }
      await compile(files, opts);
    });

  commander
    .command('compile-folder <folder> <outFolder>')
    .description(
      `Batch compile all extracted translation JSON files in <folder> to <outFolder> containing
react-intl consumable JSON. We also verify that the messages are 
valid ICU and not malformed.`
    )
    .option(
      '--format <path>',
      `Path to a formatter file that converts JSON files in \`<folder>\` to \`Record<string, string>\`
so we can compile. The file must export a function named \`compile\` with the signature:
\`\`\`
type CompileFn = <T = Record<string, MessageDescriptor>>(
  msgs: T
) => Record<string, string>;
\`\`\`
This is especially useful to convert from a TMS-specific format back to react-intl format
`
    )
    .option(
      '--ast',
      `Whether to compile to AST. See https://formatjs.io/docs/guides/advanced-usage#pre-parsing-messages
for more information`
    )
    .action(async (folder: string, outFolder: string, opts?: Opts) => {
      // fast-glob expect `/` in Windows as well
      const files = globSync(`${folder}/*.json`);
      if (!files.length) {
        throw new Error(`No JSON file found in ${folder}`);
      }
      await compileFolder(files, outFolder, opts);
    });

  if (argv.length < 3) {
    commander.help();
  } else {
    commander.parse(argv);
  }
}
export default main;
