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

Take a look at [`ts-jest` guide](https://github.com/kulshekhar/ts-jest/blob/master/docs/user/config/astTransformers.md) on how to incorporate custom AST Transformers.

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

### **`idInterpolationPattern`**

If certain message descriptors don't have id, this `pattern` will be used to automaticallygenerate IDs for them. Default to `[contenthash:5]`. See https://github.com/webpack/loader-utils#interpolatename for sample patterns.

### **`removeDefaultMessage`**

Remove `defaultMessage` field in generated js after extraction.

### **`extractSourceLocation`**

Whether the metadata about the location of the message in the source file should be extracted. If `true`, then `file`, `start`, and `end` fields will exist for each extracted message descriptors. Defaults to `false`.

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
