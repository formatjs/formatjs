---
id: babel-plugin
title: babel-plugin-formatjs
---

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
npm i babel-plugin-formatjs
```

</TabItem>
<TabItem value="yarn">

```sh
yarn add babel-plugin-formatjs
```

</TabItem>
</Tabs>

## Usage

**This Babel plugin only visits ES6 modules which `import` React Intl.**

The default message descriptors for the app's default language will be processed from: `defineMessages()`, `defineMessage()`, `intl.formatMessage` and `<FormattedMessage>`; all of which are named exports of the React Intl package.

### Via `babel.config.json` (Recommended)

**babel.config.json**

```json
{
  "plugins": [
    [
      "formatjs",
      {
        "idInterpolationPattern": "[sha512:contenthash:base64:6]",
        "ast": true
      }
    ]
  ]
}
```

### Via Node API

The extract message descriptors are available via the `metadata` property on the object returned from Babel's `transform()` API:

```javascript
require('@babel/core').transform('code', {
  plugins: ['formatjs'],
}) // => { code, map, ast, metadata['formatjs'].messages, metadata['formatjs'].meta };
```

## Options

### **`overrideIdFn`**

A function with the signature `(id: string, defaultMessage: string, description: string|object) => string` which allows you to override the ID both in the extracted javascript and messages.

### **`idInterpolationPattern`**

If certain message descriptors don't have id, this `pattern` will be used to automaticallygenerate IDs for them. Default to `[sha512:contenthash:base64:6]`. See [nodejs crypto createHash](https://nodejs.org/api/crypto.html#crypto_crypto_createhash_algorithm_options) for hash algorithms & [nodejs buffer docs](https://nodejs.org/api/buffer.html#buffer_buffers_and_character_encodings) for digest encodings.

### **`removeDefaultMessage`**

Remove `defaultMessage` field in generated js after extraction.

### **`additionalComponentNames`**

Additional component names to extract messages from, e.g: `['FormattedFooBarMessage']`. **NOTE**: By default we check for the fact that `FormattedMessage` are imported from `moduleSourceName` to make sure variable alias works. This option does not do that so it's less safe.

### **`additionalFunctionNames`**

Additional function names to extract messages from, e.g: `['$formatMessage']`. Use this if you prefer to alias `formatMessage` to something shorter like `$t`.

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
