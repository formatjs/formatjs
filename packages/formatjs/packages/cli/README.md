# `formatjs-cli`

This CLI allows you to extract `intl-messageformat` messages from JavaScript / TypeScript source code,
including React components that uses `react-intl`.

## Usage

```shell
$ npm -g i @formatjs/cli
$ formatjs extract --help
Usage: formatjs extract [options] [files...]
Extract string messages from React components that use react-intl.
The input language is expected to be TypeScript or ES2017 with JSX.

Options:
  --messages-dir <dir>                                  The target location where the plugin will output a `.json` file
                                                        corresponding to each component from which React Intl messages
                                                        were extracted. If not provided, the extracted message
                                                        descriptors will be printed to standard output.
  --out-file <path>                                     The target file path where the plugin will output an aggregated \`.json\` file of allthe translations from the \`files\`
                                                        supplied.
                                                        This flag will ignore --messages-dir
  --id-interpolation-pattern <pattern>                  If certain message descriptors don\'t have id, this \`pattern\` will be used to automaticallygenerate IDs for them. Default to
                                                        \`[contenthash:5]\`.
                                                        See https://github.com/webpack/loader-utils#interpolatename for sample patterns
  --extract-source-location                             Whether the metadata about the location of the message in the
                                                        source file should be extracted. If `true`, then `file`,
                                                        `start`, and `end` fields will exist for each extracted message
                                                        descriptors. (default: false)
  --module-source-name <name>                           The ES6 module source name of the React Intl package. Defaults
                                                        to: `"react-intl"`, but can be changed to another name/path to
                                                        React Intl.
  --remove-default-message                              Remove `defaultMessage` field in generated js after extraction
                                                        (default: false)
  --additional-component-names <comma-separated-names>  Additional component names to extract messages from, e.g:
                                                        `['FormattedFooBarMessage']`. **NOTE**: By default we check for
                                                        the fact that `FormattedMessage` & `FormattedHTMLMessage` are
                                                        imported from `moduleSourceName` to make sure variable alias
                                                        works. This option does not do that so it's less safe.
  --extract-from-format-message-call                    Opt-in to extract from `intl.formatMessage` call with the same
                                                        restrictions, e.g: has to be called with object literal such as
                                                        `intl.formatMessage({ id: 'foo', defaultMessage: 'bar',
                                                        description: 'baz'})` (default: false)
  -h, --help                                            output usage information
```
