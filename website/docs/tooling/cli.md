---
id: cli
title: CLI
---

## Installation

```sh
npm i -D @formatjs/cli
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

### `--out-file <output>`

The target file that contains compiled messages.

### `--ast`

Whether to compile message into AST instead of just string. See [Advanced Usage](../react-intl/advanced-usage.md)
