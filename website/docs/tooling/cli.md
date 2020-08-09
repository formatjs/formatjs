---
id: cli
title: CLI
---

## Installation

```sh
npm i -D @formatjs/cli
```

Add the following command to your `package.json` `scripts`:

```json
{
  "scripts": {
    "extract": "formatjs extract",
    "compile": "formatjs compile"
  }
}
```

We've built https://www.npmjs.com/package/@formatjs/cli that helps you extract messages from a list of files. It uses [`@formatjs/ts-transformer`](ts-transformer.md) under the hood and should be able to extract messages if you're declaring using 1 of the mechanisms below:

```tsx
import {defineMessages, defineMessage} from 'react-intl';

defineMessages({
  foo: {
    id: 'foo',
    defaultMessage: 'foo',
    description: 'bar',
  },
});

defineMessage({
  id: 'single',
  defaultMessage: 'single message',
  description: 'header',
});
```

```tsx
import {FormattedMessage} from 'react-intl';

<FormattedMessage id="foo" defaultMessage="foo" description="bar" />;
```

```tsx
function Comp(props) {
  const {intl} = props;
  return intl.formatMessage({
    // The whole `intl.formatMessage` is required so we can extract
    id: 'foo',
    defaultMessage: 'foo',
    description: 'bar',
  });
}
```

## Extraction

```sh
formatjs extract --help
# Usage: formatjs extract [options] [files...]

# Extract string messages from React components that use react-intl.
# The input language is expected to be TypeScript or ES2017 with JSX.
```

### `--format [path]`

Path to a formatter file that controls the shape of JSON file from `--out-file`.
The formatter file must export a function called `format` with the signature

```tsx
type FormatFn = <T = Record<string, MessageDescriptor>>(
  msgs: Record<string, MessageDescriptor>
) => T;
```

This is especially useful to convert from our extracted format to a TMS-specific format.

### `--out-file [path]`

The target file path where the plugin will output an aggregated `.json` file of allthe translations from the `files` supplied. This flag will ignore `--messages-dir`

### `--id-interpolation-pattern [pattern]`

If certain message descriptors don't have id, this `pattern` will be used to automaticallygenerate IDs for them. Default to `[contenthash:5]`. See https://github.com/webpack/loader-utils#interpolatename for sample patterns

### `--extract-source-location`

Whether the metadata about the location of the message in the source file should be extracted. If `true`, then `file`, `start`, and `end` fields will exist for each extracted message descriptors. (default: `false`)

### `--additional-component-names [comma-separated-names]`

Additional component names to extract messages from, e.g: `['FormattedFooBarMessage']`. **NOTE**: By default we check for the fact that `FormattedMessage` is imported from `moduleSourceName` to make sure variable alias works. This option does not do that so it's less safe.

### `--extract-from-format-message-call`

Opt-in to extract from `intl.formatMessage` call with the same restrictions, e.g: has to be called with object literal such as `intl.formatMessage({ id: 'foo', defaultMessage: 'bar', description: 'baz'})` (default: `false`)

### `--output-empty-json`

Output file with empty [] if src has no messages. For build systems like [bazel](https://bazel.build/) that relies on specific output mapping, not writing out a file can cause issues. (default: `false`)

### `--ignore [files]`

List of glob paths to **not** extract translations from.

### `--throws`

Whether to throw an exception when we fail to process any file in the batch.

### `--pragma [pragma]`

Parse specific additional custom pragma. This allows you to tag certain file with metadata such as `project`. For example with this file:

```tsx
// @intl-meta project:my-custom-project
import {FormattedMessage} from 'react-intl';

<FormattedMessage defaultMessage="foo" id="bar" />;
```

and with option `{pragma: "@intl-meta"}`, we'll parse out `// @intl-meta project:my-custom-project` into `{project: 'my-custom-project'}` in the result file.

## Compilation

Compile extracted file from `formatjs extract` to a react-intl consumable
JSON file. This also does ICU message verification. See [Message Distribution](../getting-started/message-distribution.md) for more details.

```sh
formatjs compile --help
```

### `--format [path]`

Path to a formatter file that converts `<translation_file>` to `Record<string, string>` so we can compile. The file must export a function named `compile` with the signature:

```tsx
type CompileFn = <T = Record<string, MessageDescriptor>>(
  msgs: T
) => Record<string, string>;
```

This is especially useful to convert from a TMS-specific format back to react-intl format

### `--out-file <output>`

The target file that contains compiled messages.

### `--ast`

Whether to compile message into AST instead of just string. See [Advanced Usage](../guides/advanced-usage.md)

## Folder Compilation

Batch compile a folder with extracted files from `formatjs extract` to a folder containing react-intl consumable JSON files. This also does ICU message verification. See [Message Distribution](../getting-started/message-distribution.md) for more details.

```sh
formatjs compile-folder [options] <folder> <outFolder>
```

### `--format [path]`

Path to a formatter file that converts `<translation_file>` to `Record<string, string>` so we can compile. The file must export a function named `compile` with the signature:

```tsx
type CompileFn = <T = Record<string, MessageDescriptor>>(
  msgs: T
) => Record<string, string>;
```

This is especially useful to convert from a TMS-specific format back to react-intl format

### `--ast`

Whether to compile message into AST instead of just string. See [Advanced Usage](../guides/advanced-usage.md)

## Builtin Formatters

We provide the following built-in formatters to integrate with 3rd party TMSes:

| TMS                                                                                       | `--format`  |
| ----------------------------------------------------------------------------------------- | ----------- |
| [Transifex's Structured JSON](https://docs.transifex.com/formats/json/structured-json)    | `transifex` |
| [Smartling ICU JSON](https://help.smartling.com/hc/en-us/articles/360008000733-JSON)      | `smartling` |
| [Lingohub](https://lingohub.com/developers/resource-files/json-localization/)             | `simple`    |
| [Phrase](https://help.phrase.com/help/simple-json)                                        | `simple`    |
| [Crowdin Chrome JSON](https://support.crowdin.com/file-formats/chrome-json/)              | `crowdin`   |
| [Lokalise Structured JSON](https://docs.lokalise.com/en/articles/3229161-structured-json) | `lokalise`  |

## Custom Formatters

You can provide your own formatter by using our interfaces:

```tsx
import {FormatFn, CompileFn, Comparator} from '@formatjs/cli';

interface VendorJson {}

// [Optional] Format @formatjs/cli structure to vendor's structure
export const format: FormatFn<VendorJson> = () => {};
// [Optional] Format vendor's structure to @formatjs/cli structure
export const compile: CompileFn<VendorJson> = () => {};
// [Optional] Sort the messages in a specific order during serialization
export const compareMessages: Comparator = () => {};
```

Take a look at our [builtin formatter code](https://github.com/formatjs/formatjs/tree/main/packages/cli/src/formatters) for some examples.

## Node API

`@formatjs/cli` can also be consumed programmatically like below:

### Extraction

```tsx
import {extract} from '@formatjs/cli';

const resultAsString: Promise<string> = extract(files, {
  idInterpolationPattern: '[sha512:contenthash:base64:6]',
});
```

### Compilation

```tsx
import {compile} from '@formatjs/cli';

const resultAsString: Promise<string> = compile(files, {
  ast: true,
});
```

### Custom Formatter

```tsx
import {FormatFn, CompileFn, Comparator} from '@formatjs/cli';

export const format: FormatFn = msgs => msgs;

// Sort key reverse alphabetically
export const compareMessages = (el1, el2) => {
  return el1.key < el2.key ? 1 : -1;
};

export const compile: CompileFn = msgs => {
  const results: Record<string, string> = {};
  for (const k in msgs) {
    results[k] = msgs[k].defaultMessage!;
  }
  return results;
};
```
