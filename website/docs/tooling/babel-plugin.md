---
id: babel-plugin
title: babel-plugin-react-intl
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
npm i babel-plugin-react-intl
```

</TabItem>
<TabItem value="yarn">

```sh
yarn add babel-plugin-react-intl
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
      "react-intl",
      {
        "idInterpolationPattern": "[sha512:contenthash:base64:6]",
        "extractFromFormatMessageCall": true,
        "ast": true
      }
    ]
  ]
}
```

## Options

### **`moduleSourceName`**

The ES6 module source name of the React Intl package. Defaults to: `"react-intl"`, but can be changed to another name/path to React Intl.

### **`overrideIdFn`**

A function with the signature `(id: string, defaultMessage: string, description: string|object) => string` which allows you to override the ID both in the extracted javascript and messages.

### **`idInterpolationPattern`**

If certain message descriptors don't have id, this `pattern` will be used to automaticallygenerate IDs for them. Default to `[contenthash:5]`. See https://github.com/webpack/loader-utils#interpolatename for sample patterns.

### **`removeDefaultMessage`**

Remove `defaultMessage` field in generated js after extraction.

### **`extractFromFormatMessageCall`**

Opt-in to compile `intl.formatMessage` call with the same restrictions, e.g: has to be called with object literal such as `intl.formatMessage({ id: 'foo', defaultMessage: 'bar', description: 'baz'})`

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

### Via Node API

The extract message descriptors are available via the `metadata` property on the object returned from Babel's `transform()` API:

```javascript
require('@babel/core').transform('code', {
  plugins: ['react-intl'],
}) // => { code, map, ast, metadata['react-intl'].messages, metadata['react-intl'].meta };
```
