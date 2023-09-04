import {program} from 'commander'
import loudRejection from 'loud-rejection'
import extract, {ExtractCLIOptions} from './extract'
import compile, {CompileCLIOpts, Opts} from './compile'
import compileFolder from './compile_folder'
import {sync as globSync} from 'fast-glob'
import {debug} from './console_utils'

const KNOWN_COMMANDS = ['extract']

async function main(argv: string[]) {
  loudRejection()

  program
    // TODO: fix this
    .version('5.0.6', '-v, --version')
    .usage('<command> [flags]')
    .action(command => {
      if (!KNOWN_COMMANDS.includes(command)) {
        program.help()
      }
    })

  program
    .command('help', {isDefault: true})
    .description('Show this help message.')
    .action(() => program.help())

  // Long text wrapping to available terminal columns: https://github.com/tj/commander.js/pull/956
  // NOTE: please keep the help text in sync with babel-plugin-formatjs documentation.
  program
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
generate IDs for them. Default to \`[sha512:contenthash:base64:6]\` where \`contenthash\` is the hash of
\`defaultMessage\` and \`description\`.
See https://github.com/webpack/loader-utils#interpolatename for sample patterns`,
      '[sha512:contenthash:base64:6]'
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
      `Additional component names to extract messages from, e.g: \`'FormattedFooBarMessage'\`.
**NOTE**: By default we check for the fact that \`FormattedMessage\`
is imported from \`moduleSourceName\` to make sure variable alias
works. This option does not do that so it's less safe.`,
      (val: string) => val.split(',')
    )
    .option(
      '--additional-function-names <comma-separated-names>',
      `Additional function names to extract messages from, e.g: \`'$t'\`.`,
      (val: string) => val.split(',')
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

      and with option \`{pragma: "intl-meta"}\`, we'll parse out \`// @intl-meta project:my-custom-project\` into \`{project: 'my-custom-project'}\` in the result file.`
    )
    .option(
      '--preserve-whitespace',
      'Whether to preserve whitespace and newlines.'
    )
    .option(
      '--flatten',
      `Whether to hoist selectors & flatten sentences as much as possible. E.g:
"I have {count, plural, one{a dog} other{many dogs}}"
becomes "{count, plural, one{I have a dog} other{I have many dogs}}".
The goal is to provide as many full sentences as possible since fragmented
sentences are not translator-friendly.`
    )
    .action(async (filePatterns: string[], cmdObj: ExtractCLIOptions) => {
      debug('File pattern:', filePatterns)
      debug('Options:', cmdObj)
      const files = globSync(filePatterns, {
        ignore: cmdObj.ignore,
      })

      debug('Files to extract:', files)

      await extract(files, {
        outFile: cmdObj.outFile,
        idInterpolationPattern:
          cmdObj.idInterpolationPattern || '[sha1:contenthash:base64:6]',
        extractSourceLocation: cmdObj.extractSourceLocation,
        removeDefaultMessage: cmdObj.removeDefaultMessage,
        additionalComponentNames: cmdObj.additionalComponentNames,
        additionalFunctionNames: cmdObj.additionalFunctionNames,
        throws: cmdObj.throws,
        pragma: cmdObj.pragma,
        format: cmdObj.format,
        // It is possible that the glob pattern does NOT match anything.
        // But so long as the glob pattern is provided, don't read from stdin.
        readFromStdin: filePatterns.length === 0,
        preserveWhitespace: cmdObj.preserveWhitespace,
        flatten: cmdObj.flatten,
      })
      process.exit(0)
    })

  program
    .command('compile [translation_files...]')
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
    .option(
      '--skip-errors',
      `Whether to continue compiling messages after encountering an error. Any keys with errors will not be included in the output file.`
    )
    .option(
      '--pseudo-locale <pseudoLocale>',
      `Whether to generate pseudo-locale files. See https://formatjs.io/docs/tooling/cli#--pseudo-locale-pseudolocale for possible values.
"--ast" is required for this to work.`
    )
    .action(async (filePatterns: string[], opts: CompileCLIOpts) => {
      debug('File pattern:', filePatterns)
      debug('Options:', opts)
      const files = globSync(filePatterns)
      if (!files.length) {
        throw new Error(`No input file found with pattern ${filePatterns}`)
      }
      debug('Files to compile:', files)
      await compile(files, opts)
    })

  program
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
      debug('Folder:', folder)
      debug('Options:', opts)
      // fast-glob expect `/` in Windows as well
      const files = globSync(`${folder}/*.json`)
      if (!files.length) {
        throw new Error(`No JSON file found in ${folder}`)
      }
      debug('Files to compile:', files)
      await compileFolder(files, outFolder, opts)
    })

  if (argv.length < 3) {
    program.help()
  } else {
    program.parse(argv)
  }
}
export default main
