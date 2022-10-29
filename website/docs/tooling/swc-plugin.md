---
id: swc-plugin
title: swc-plugin
---

[![npm version](https://badgen.net/npm/v/@formatjs/swc-plugin)](https://badgen.net/npm/v/@formatjs/swc-plugin)

Process string messages for translation from modules that use react-intl, specifically:

- Parse and verify that messages are ICU-compliant w/o any syntax issues.
- Remove `description` from message descriptor to save bytes since it isn't used at runtime.
- Option to remove `defaultMessage` from message descriptor to save bytes since it isn't used at runtime.
- Automatically inject message ID based on specific pattern.

:::caution
`@formatjs/swc-plugin` is not currently compatible with TypeScript due to [swc-project/swc#4648](https://github.com/swc-project/swc/issues/4648). Attempting to compile a TypeScript codebase with the swc plugin will likely result in the error "Method visitTsType not implemented."
:::

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
npm i @formatjs/swc-plugin
```

</TabItem>
<TabItem value="yarn">

```sh
yarn add @formatjs/swc-plugin
```

</TabItem>
</Tabs>

## Usage

The default message descriptors for the app's default language will be processed from: `defineMessages()`, `defineMessage()`, `intl.formatMessage` and `<FormattedMessage>`; all of which are named exports of the React Intl package.

```tsx
import {transform} from '@swc/core'
import {FormatJSTransformer, Opts} from '@formatjs/swc-plugin'

const opts: Opts = {
  overrideIdFn: '[hash:base64:10]',
}

const output = await transform(input, {
  filename: filePath,
  jsc: {
    parser: {
      syntax: 'typescript',
      tsx: true,
      decorators: true,
      dynamicImport: true,
    },
  },
  plugin: m => new FormatJSTransformer(opts).visitProgram(m),
})
```

## Options

### **`overrideIdFn`**

A function with the signature `(id: string, defaultMessage: string, description?: string|object, filePath: string) => string` which allows you to override the ID both in the extracted javascript and messages.

Alternatively, `overrideIdFn` can be a template string, which is used only if the message ID is empty.

### **`removeDefaultMessage`**

Remove `defaultMessage` field in generated js after extraction.

### **`extractSourceLocation`**

Whether the metadata about the location of the message in the source file should be extracted. If `true`, then `file`, `start`, and `end` fields will exist for each extracted message descriptors. Defaults to `false`.

### **`additionalComponentNames`**

Additional component names to extract messages from, e.g: `['FormattedFooBarMessage']`. **NOTE**: By default we check for the fact that `FormattedMessage` are imported from `moduleSourceName` to make sure variable alias works. This option does not do that so it's less safe.

### **`additionalFunctionNames`**

Additional function names to extract messages from, e.g: `['$formatMessage']`. Use this if you prefer to alias `formatMessage` to something shorter like `$t`.

### **`ast`**

Pre-parse `defaultMessage` into AST for faster runtime perf. This flag doesn't do anything when `removeDefaultMessage` is `true`.

### **`onMsgExtracted(filePath: string, msgs: MessageDescriptor[])`**

Callback that gets triggered whenever a message is encountered.

### **`preserveWhitespace`**

Whether to preserve whitespace and newlines.

### **`filename`**

Path of the source file

Take a look at out tests [`utils.ts`](https://github.com/formatjs/formatjs/blob/main/packages/swc-plugin/tests/utils.ts) for example in integration.
