import commander from 'commander';
import loudRejection from 'loud-rejection';
import extract, {ExtractCLIOptions} from './extract';

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
      [
        'Extract string messages from React components that use react-intl.',
        'The input language is expected to be TypeScript or ES2017 with JSX.',
      ].join('\n')
    )
    .option(
      '--messages-dir <dir>',
      [
        'The target location where the plugin will output a `.json` file corresponding to each ',
        'component from which React Intl messages were extracted. If not provided, the extracted ',
        'message descriptors will be printed to standard output.',
      ].join('')
    )
    .option(
      '--enforce-descriptions',
      [
        'Whether message declarations _must_ contain a `description` to provide context to ',
        'translators.',
      ].join(''),
      false
    )
    .option(
      '--enforce-default-message',
      [
        'Whether message declarations _must_ contain a `defaultMessage` to fallback when ',
        'translations are not present.',
      ].join(''),
      true
    )
    .option('--no-enforce-default-message')
    .option(
      '--extract-source-location',
      [
        'Whether the metadata about the location of the message in the source file should be ',
        'extracted. If `true`, then `file`, `start`, and `end` fields will exist for each ',
        'extracted message descriptors.',
      ].join(''),
      false
    )
    .option(
      '--module-source-name <name>',
      [
        'The ES6 module source name of the React Intl package. Defaults to: `"react-intl"`, ',
        'but can be changed to another name/path to React Intl.',
      ].join('')
    )
    .option(
      '--remove-default-message',
      'Remove `defaultMessage` field in generated js after extraction',
      false
    )
    .option(
      '--additional-component-names <comma-separated-names>',
      [
        "Additional component names to extract messages from, e.g: `['FormattedFooBarMessage']`. ",
        '**NOTE**: By default we check for the fact that `FormattedMessage` & ',
        '`FormattedHTMLMessage` are imported from `moduleSourceName` to make sure variable alias ',
        "works. This option does not do that so it's less safe.",
      ].join(''),
      (val: string) => val.split(',')
    )
    .option(
      '--extract-from-format-message-call',
      [
        'Opt-in to extract from `intl.formatMessage` call with the same restrictions, e.g: has ',
        "to be called with object literal such as `intl.formatMessage({ id: 'foo', defaultMessage: ",
        "'bar', description: 'baz'})`",
      ].join(''),
      false
    )
    .action(async (files: readonly string[], cmdObj: ExtractCLIOptions) => {
      await extract(files, {
        messagesDir: cmdObj.messagesDir,
        enforceDescriptions: cmdObj.enforceDescriptions,
        enforceDefaultMessage: cmdObj.enforceDefaultMessage,
        extractSourceLocation: cmdObj.extractSourceLocation,
        moduleSourceName: cmdObj.moduleSourceName,
        removeDefaultMessage: cmdObj.removeDefaultMessage,
        additionalComponentNames: cmdObj.additionalComponentNames,
        extractFromFormatMessageCall: cmdObj.extractFromFormatMessageCall,
      });
      process.exit(0);
    });

  if (argv.length < 3) {
    commander.help();
  } else {
    commander.parse(argv);
  }
}
export default main;
