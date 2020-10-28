---
id: ts-transformer
title: ts-transformer
---

[![npm version](https://badgen.net/npm/v/@formatjs/ts-transformer)](https://badgen.net/npm/v/@formatjs/ts-transformer)

Process string messages for translation from modules that use react-intl, specifically:

- Parse and verify that messages are ICU-compliant w/o any syntax issues.
- Remove `description` from message descriptor to save bytes since it isn't used at runtime.
- Option to remove `defaultMessage` from message descriptor to save bytes since it isn't used at runtime.
- Automatically inject message ID based on specific pattern.

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
npm i @formatjs/ts-transformer
```

</TabItem>
<TabItem value="yarn">

```sh
yarn add @formatjs/ts-transformer
```

</TabItem>
</Tabs>

## Usage

The default message descriptors for the app's default language will be processed from: `defineMessages()`, `defineMessage()`, `intl.formatMessage` and `<FormattedMessage>`; all of which are named exports of the React Intl package.

### Via `ts-loader`

```tsx
import {transform} from '@formatjs/ts-transformer'

module.exports = {
  ...otherConfigs,
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              getCustomTransformers: {
                before: [
                  transform({
                    overrideIdFn: '[sha512:contenthash:base64:6]',
                    ast: true,
                  }),
                ],
              },
            },
          },
        ],
      },
    ],
  },
}
```

### Via `ts-jest` in `jest.config.js`

:::caution
This requires `ts-jest@26.4.0` or later
:::

```js
// jest.config.js
module.exports = {
  // [...]
  globals: {
    'ts-jest': {
      astTransformers: {
        before: [
          {
            path: '@formatjs/ts-transformer/ts-jest-integration',
            options: {
              // options
              overrideIdFn: '[sha512:contenthash:base64:6]',
              ast: true,
            },
          },
        ],
      },
    },
  },
}
```

### Via `ttypescript`

```json
{
  "compilerOptions": {
    "plugins": [
      {
        "transform": "@formatjs/ts-transformer",
        "import": "transform",
        "type": "config",
        "overrideIdFn": "[sha512:contenthash:base64:6]",
        "ast": true
      }
    ]
  }
}
```

### Via `rollup-plugin-typescript2`

```ts
// rollup.config.js
import typescript from 'rollup-plugin-typescript2'
import {transform} from '@formatjs/ts-transformer'

export default {
  input: './main.ts',

  plugins: [
    typescript({
      transformers: () => ({
        before: [
          transform({
            overrideIdFn: '[sha512:contenthash:base64:6]',
            ast: true,
          }),
        ],
      }),
    }),
  ],
}
```

## Options

### **`overrideIdFn`**

A function with the signature `(id: string, defaultMessage: string, description: string|object) => string` which allows you to override the ID both in the extracted javascript and messages.

Alternatively, `overrideIdFn` can be a template string, which is used only if the message ID is empty.

### **`removeDefaultMessage`**

Remove `defaultMessage` field in generated js after extraction.

### **`extractSourceLocation`**

Whether the metadata about the location of the message in the source file should be extracted. If `true`, then `file`, `start`, and `end` fields will exist for each extracted message descriptors. Defaults to `false`.

## **`extractFromFormatMessageCall`**

Opt-in to extract from `intl.formatMessage` call with the same restrictions, e.g: has to be called with object literal such as `intl.formatMessage({ id: 'foo', defaultMessage: 'bar', description: 'baz'}`

### **`additionalComponentNames`**

Additional component names to extract messages from, e.g: `['FormattedFooBarMessage']`. **NOTE**: By default we check for the fact that `FormattedMessage` are imported from `moduleSourceName` to make sure variable alias works. This option does not do that so it's less safe.

### **`pragma`**

parse specific additional custom pragma. This allows you to tag certain file with metadata such as `project`. For example with this file:

```tsx
// @intl-meta project:my-custom-project
import {FormattedMessage} from 'react-intl'
;<FormattedMessage defaultMessage="foo" id="bar" />
```

and with option `{pragma: "@intl-meta"}`, we'll parse out `// @intl-meta project:my-custom-project` into `{project: 'my-custom-project'}` in the result file.

### **`ast`**

Pre-parse `defaultMessage` into AST for faster runtime perf. This flag doesn't do anything when `removeDefaultMessage` is `true`.

### **`onMsgExtracted(filePath: string, msgs: MessageDescriptor[])`**

Callback that gets triggered whenever a message is encountered.

### **`onMetaExtracted(filePath: string, meta: Record<string, string>)`**

Callback that gets triggered whenever a `pragme` meta is encountered.

Take a look at [`compile.ts`](https://github.com/formatjs/formatjs/blob/master/packages/ts-transformer/compile.ts) for example in integration.
