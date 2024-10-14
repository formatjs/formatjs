---
id: cli
title: CLI
---

## Installation

import Tabs from '@theme/Tabs'
import TabItem from '@theme/TabItem'

<Tabs
groupId="npm"
defaultValue="npm"
values={[
{label: 'npm', value: 'npm'},
{label: 'yarn', value: 'yarn'},
]}>
<TabItem value="npm">

```sh
npm i -D @formatjs/cli
```

</TabItem>
<TabItem value="yarn">

```sh
yarn add -D @formatjs/cli
```

</TabItem>
</Tabs>

Add the following command to your `package.json` `scripts`:

```json
{
  "scripts": {
    "extract": "formatjs extract",
    "compile": "formatjs compile"
  }
}
```

We've built this [CLI](https://www.npmjs.com/package/@formatjs/cli) that helps you extract messages from a list of files. It uses [`@formatjs/ts-transformer`](ts-transformer.md) under the hood and should be able to extract messages if you're declaring using 1 of the mechanisms below:

```tsx
import {defineMessages, defineMessage} from 'react-intl'

defineMessages({
  foo: {
    id: 'foo',
    defaultMessage: 'foo',
    description: 'bar',
  },
})

defineMessage({
  id: 'single',
  defaultMessage: 'single message',
  description: 'header',
})
```

```tsx
import {FormattedMessage} from 'react-intl'
;<FormattedMessage id="foo" defaultMessage="foo" description="bar" />
```

```tsx
function Comp(props) {
  const {intl} = props
  return intl.formatMessage({
    // The whole `intl.formatMessage` is required so we can extract
    id: 'foo',
    defaultMessage: 'foo',
    description: 'bar',
  })
}
```

## Extraction

<Tabs
groupId="npm"
defaultValue="npm"
values={[
{label: 'npm', value: 'npm'},
{label: 'yarn', value: 'yarn'},
]}>
<TabItem value="npm">

```sh
npm run extract -- --help
# Usage: formatjs extract [options] [files...]

# Extract string messages from React components that use react-intl.
# The input language is expected to be TypeScript or ES2017 with JSX.
```

For example:

```sh
npm run extract -- "src/**/*.{ts,tsx,vue}" --out-file lang.json
```

</TabItem>
<TabItem value="yarn">

```sh
yarn extract --help
# Usage: formatjs extract [options] [files...]

# Extract string messages from React components that use react-intl.
# The input language is expected to be TypeScript or ES2017 with JSX.
```

For example:

```sh
yarn extract "src/**/*.{ts,tsx,vue}" --out-file lang.json
```

</TabItem>
</Tabs>

:::caution
You should always quote (`"` or `'`) your glob pattern (like `"src/**/*"`) to avoid auto shell expansion of those glob, which varies depending on your shell (`zsh` vs `fish` vs `bash`).
:::

### `--format [path]`

Path to a formatter file that controls the shape of JSON file from `--out-file`.
The formatter file must export a function called `format` with the signature.

```tsx
type FormatFn = <T = Record<string, MessageDescriptor>>(
  msgs: Record<string, MessageDescriptor>
) => T
```

This is especially useful to convert from our extracted format to a TMS-specific format.

See our [builtin formatters](https://github.com/formatjs/formatjs/tree/main/packages/cli-lib/src/formatters) for examples.

### `--out-file [path]`

The target file path where the plugin will output an aggregated `.json` file of allthe translations from the `files` supplied. This flag will ignore `--messages-dir`

### `--id-interpolation-pattern [pattern]`

If certain message descriptors don't have id, this `pattern` will be used to automatically generate IDs for them. Default to `[sha512:contenthash:base64:6]`. See [nodejs crypto createHash](https://nodejs.org/api/crypto.html#crypto_crypto_createhash_algorithm_options) for hash algorithms & [nodejs buffer docs](https://nodejs.org/api/buffer.html#buffer_buffers_and_character_encodings) for digest encodings.

### `--extract-source-location`

Whether the metadata about the location of the message in the source file should be extracted. If `true`, then `file`, `start`, and `end` fields will exist for each extracted message descriptors. (default: `false`)

### `--additional-component-names [comma-separated-names]`

Additional component names to extract messages from, e.g: `['FormattedFooBarMessage']`. **NOTE**: By default we check for the fact that `FormattedMessage` is imported from `moduleSourceName` to make sure variable alias works. This option does not do that so it's less safe.

### `--additional-function-names [comma-separated-names]`

Additional function names to extract messages from, e.g: `['$t']`.

### `--ignore [files]`

List of glob paths to **not** extract translations from.

### `--throws`

Whether to throw an exception when we fail to process any file in the batch.

### `--pragma [pragma]`

Parse specific additional custom pragma. This allows you to tag certain file with metadata such as `project`. For example with this file:

```tsx
// @intl-meta project:my-custom-project
import {FormattedMessage} from 'react-intl'
;<FormattedMessage defaultMessage="foo" id="bar" />
```

and with option `{pragma: "intl-meta"}`, we'll parse out `// @intl-meta project:my-custom-project` into `{project: 'my-custom-project'}` in the result file.

### `--flatten`

Whether to hoist selectors & flatten sentences as much as possible. E.g:

```
I have {count, plural, one{a dog} other{many dogs}}
```

becomes

```
{count, plural, one{I have a dog} other{I have many dogs}}
```

The goal is to provide as many full sentences as possible since fragmented
sentences are not translator-friendly.

## Compilation

Compile extracted files from `formatjs extract` to a [react-intl](../react-intl.md) consumable
JSON file. This also does ICU message verification. See [Message Distribution](../getting-started/message-distribution.md) for more details.

<Tabs
groupId="npm"
defaultValue="npm"
values={[
{label: 'npm', value: 'npm'},
{label: 'yarn', value: 'yarn'},
]}>
<TabItem value="npm">

```sh
npm run compile -- --help
```

</TabItem>
<TabItem value="yarn">

```sh
yarn compile --help
```

</TabItem>
</Tabs>

### `--format [path]`

Path to a formatter file that converts `<translation_file>` to `Record<string, string>` so we can compile. The file must export a function named `compile` with the signature:

```tsx
type CompileFn = <T = Record<string, MessageDescriptor>>(
  msgs: T
) => Record<string, string>
```

This is especially useful to convert from a TMS-specific format back to react-intl format.

See our [builtin formatters](https://github.com/formatjs/formatjs/tree/main/packages/cli-lib/src/formatters) for examples.

### `--out-file <output>`

The target file that contains compiled messages.

### `--ast`

Whether to compile message into AST instead of just string. See [Advanced Usage](../guides/advanced-usage.md)

### `--pseudo-locale <pseudoLocale>`

Whether we should compile messages into pseudo locales instead. Available pseudo-locales:

Given the English message `my name is {name}`

| Locale  | Message                                      |
| ------- | -------------------------------------------- |
| `xx-LS` | `my name is {name}SSSSSSSSSSSSSSSSSSSSSSSSS` |
| `xx-AC` | `MY NAME IS {name}`                          |
| `xx-HA` | `[javascript]my name is {name}`              |
| `en-XA` | `[ḿẏ ƞȧȧḿḗḗ īş {name}]`                      |
| `en-XB` | `‮ɯʎ uɐɯǝ ıs {name}‬`                        |

:::caution
Requires `--ast`
:::

## Extraction and compilation with a single script

In some environments you may want to simply extract your messages to a file ready for use with react-intl without using an intermediary extracted message file format. This could be useful for quickly and easily creating the file for the original language that uses the default messages. This could also be useful if you use a Translation Management System (TMS) that is best suited to working with the compiled files. Keep in mind that the compiled file does not contain message descriptions so it is harder to work with for translators. Ideally you want to find or write a custom formatter you can use to extract messages into a file format that works with your TMS.

In order to achieve extraction and compilation in a single script, you can simply set up a script for that in `package.json` like in this example:

```json
"scripts": {
  "extract": "formatjs extract",
  "compile": "formatjs compile",
  "extract-compile": "formatjs extract 'src/**/*.ts*' --out-file temp.json --flatten --id-interpolation-pattern '[sha512:contenthash:base64:6]' && formatjs compile 'temp.json' --out-file lang/en.json && rm temp.json"
}
```

### Breakdown of the script

The `extract-compile` example script consists of three operations performed one after the other.

```sh
formatjs extract 'src/**/*.ts*' --out-file temp.json --flatten --id-interpolation-pattern '[sha512:contenthash:base64:6]'
```

The first script extracts messages from all typescript files that are located in subfolders of `src`. You may need to ignore certain files that could trigger errors or warnings in the script, such as `--ignore myFolder/myFile.ts`

```sh
formatjs compile 'temp.json' --out-file lang/en.json
```

The second script compiles the messages from `temp.json` into the file `lang/en.json`. This file is ready to be consumed by react-intl.

```sh
rm temp.json
```

The last script deletes the `temp.json` extracted file. Feel free remove this from the script if you wish to keep this file around.

### The resulting files

Here you can see the difference between the extracted (using the default formatter) and the compiled file formats. In the script above, `temp.json` is the extracted file and `en.json` is the compiled file.
<Tabs
groupId="json"
defaultValue="extracted"
values={[
{label: 'Extracted messages', value: 'extracted'},
{label: 'Compiled messages', value: 'compiled'},
]}>
<TabItem value="extracted">

```json
{
  "hak27d": {
    "defaultMessage": "Control Panel",
    "description": "title of control panel section"
  },
  "haqsd": {
    "defaultMessage": "Delete user {name}",
    "description": "delete button"
  },
  "19hjs": {
    "defaultMessage": "New Password",
    "description": "placeholder text"
  },
  "explicit-id": {
    "defaultMessage": "Confirm Password",
    "description": "placeholder text"
  }
}
```

</TabItem>
<TabItem value="compiled">

```json
{
  "hak27d": "Control Panel",
  "haqsd": "Delete user {name}",
  "19hjs": "New Password",
  "explicit-id": "Confirm Password"
}
```

</TabItem>
</Tabs>

## Folder Compilation

Batch compile a folder with extracted files from `formatjs extract` to a folder containing react-intl consumable JSON files. This also does ICU message verification. See [Message Distribution](../getting-started/message-distribution.md) for more details.

<Tabs
groupId="npm"
defaultValue="npm"
values={[
{label: 'npm', value: 'npm'},
{label: 'yarn', value: 'yarn'},
]}>
<TabItem value="npm">

```sh
npm run formatjs compile-folder [options] <folder> <outFolder>
```

</TabItem>
<TabItem value="yarn">

```sh
yarn formatjs compile-folder [options] <folder> <outFolder>
```

</TabItem>
</Tabs>

Folder structure should be in the form of `<folder>/<locale>.json` and the output would be `<outFolder>/<locale>.json`.

### `--format [path]`

Path to a formatter file that converts `<translation_file>` to `Record<string, string>` so we can compile. The file must export a function named `compile` with the signature:

```tsx
type CompileFn = <T = Record<string, MessageDescriptor>>(
  msgs: T
) => Record<string, string>
```

This is especially useful to convert from a TMS-specific format back to react-intl format

### `--ast`

Whether to compile message into AST instead of just string. See [Advanced Usage](../guides/advanced-usage.md)

### `--skip-errors`

Whether to continue compiling messages after encountering an error parsing one of them. Any keys with errors will not be included in the output file.

## Builtin Formatters

We provide the following built-in formatters to integrate with 3rd party TMSes:

| TMS                                                                                                   | `--format`  |
| ----------------------------------------------------------------------------------------------------- | ----------- |
| [BabelEdit](https://www.codeandweb.com/babeledit/format-js)                                           | `simple`    |
| [Crowdin Chrome JSON](https://support.crowdin.com/file-formats/chrome-json/)                          | `crowdin`   |
| [Lingohub](https://lingohub.com/developers/resource-files/json-localization/)                         | `simple`    |
| [Localize's Simple JSON](https://developers.localizejs.com/docs/simple-json-import-export)            | `simple`    |
| [locize](https://docs.locize.com/integration/supported-formats#json-nested)                           | `simple`    |
| [Lokalise Structured JSON](https://docs.lokalise.com/en/articles/3229161-structured-json)             | `lokalise`  |
| [Phrase](https://support.phrase.com/hc/en-us/articles/6111390065948--JSON-React-Intl-Simple-Strings-) | `simple`    |
| [POEditor Key-Value JSON](https://poeditor.com/localization/files/key-value-json)                     | `simple`    |
| [SimpleLocalize](https://simplelocalize.io/docs/integrations/format-js-cli/)                          | `simple`    |
| [Smartling ICU JSON](https://help.smartling.com/hc/en-us/articles/360008000733-JSON)                  | `smartling` |
| [Transifex's Structured JSON](https://docs.transifex.com/formats/json/structured-json)                | `transifex` |

:::caution
The `format`s of `extract` & `compile` have to be the same, which means if you `extract --format smartling`, you have to `compile --format smartling` as well & vice versa.
:::

## Custom Formatters

You can provide your own formatter by using our interfaces:

```tsx
import {FormatFn, CompileFn, Comparator} from '@formatjs/cli'

interface VendorJson {}

// [Optional] Format @formatjs/cli structure to vendor's structure
export const format: FormatFn<VendorJson> = () => {}
// [Optional] Format vendor's structure to @formatjs/cli structure
export const compile: CompileFn<VendorJson> = () => {}
// [Optional] Sort the messages in a specific order during serialization
export const compareMessages: Comparator = () => {}
```

Take a look at our [builtin formatter code](https://github.com/formatjs/formatjs/tree/main/packages/cli-lib/src/formatters) for some examples.

## Node API

Install `@formatjs/cli-lib` instead to use programmatically

<Tabs
groupId="npm"
defaultValue="npm"
values={[
{label: 'npm', value: 'npm'},
{label: 'yarn', value: 'yarn'},
]}>
<TabItem value="npm">

```sh
npm i -D @formatjs/cli-lib
```

</TabItem>
<TabItem value="yarn">

```sh
yarn add -D @formatjs/cli-lib
```

</TabItem>
</Tabs>

### Extraction

```tsx
import {extract} from '@formatjs/cli-lib'

const resultAsString: Promise<string> = extract(files, {
  idInterpolationPattern: '[sha512:contenthash:base64:6]',
})
```

### Compilation

```tsx
import {compile} from '@formatjs/cli-lib'

const resultAsString: Promise<string> = compile(files, {
  ast: true,
})
```

### Custom Formatter

```tsx
import {FormatFn, CompileFn, Comparator} from '@formatjs/cli-lib'

export const format: FormatFn = msgs => msgs

// Sort key reverse alphabetically
export const compareMessages = (el1, el2) => {
  return el1.key < el2.key ? 1 : -1
}

export const compile: CompileFn = msgs => {
  const results: Record<string, string> = {}
  for (const k in msgs) {
    results[k] = msgs[k].defaultMessage!
  }
  return results
}
```
