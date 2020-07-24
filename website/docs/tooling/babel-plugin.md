---
id: babel-plugin
title: babel-plugin-react-intl
---

Extracts string messages for translation from modules that use [React Intl](../react-intl.md).

## Installation

```sh
$ npm install babel-plugin-react-intl
```

## Usage

**This Babel plugin only visits ES6 modules which `import` React Intl.**

The default message descriptors for the app's default language will be extracted from: `defineMessages()`, `defineMessage()`, and `<FormattedMessage>`; all of which are named exports of the React Intl package.

If a message descriptor has a `description`, it'll be removed from the source after it's extracted to save bytes since it isn't used at runtime.

### Via `babel.config.json` (Recommended)

**babel.config.json**

```json
{
  "plugins": [
    [
      "react-intl",
      {
        "messagesDir": "./build/messages/"
      }
    ]
  ]
}
```

## Options

### **`messagesDir`**

The target location where the plugin will output a `.json` file corresponding to each component from which React Intl messages were extracted. If not provided, the extracted message descriptors will only be accessible via Babel's API.

### **`workspaceRoot`**

The folder to resolve relative path of source file to. This is used to control the directory structure of `messagesDir`. For example, when extractin from:

```
my_project
|- src
|-- subdir
|--- file1.js
```

and `workspaceRoot` is set to `src`, `messagesDir` output will have the structure:

```
<messagesDir>
|- subdir
|-- file1.js
```

Specifying an invalid `workspaceRoot` (e.g if we encounter a file during parsing that does not live under `workspaceRoot`) will throw an `Error`.

### **`extractSourceLocation`**

Whether the metadata about the location of the message in the source file should be extracted. If `true`, then `file`, `start`, and `end` fields will exist for each extracted message descriptors. Defaults to `false`.

### **`moduleSourceName`**

The ES6 module source name of the React Intl package. Defaults to: `"react-intl"`, but can be changed to another name/path to React Intl.

### **`overrideIdFn`**

A function with the signature `(id: string, defaultMessage: string, description: string|object) => string` which allows you to override the ID both in the extracted javascript and messages.

### **`idInterpolationPattern`**

If certain message descriptors don't have id, this `pattern` will be used to automaticallygenerate IDs for them. Default to `[contenthash:5]`. See https://github.com/webpack/loader-utils#interpolatename for sample patterns.

### **`removeDefaultMessage`**

Remove `defaultMessage` field in generated js after extraction.

### **`additionalComponentNames`**

Additional component names to extract messages from, e.g: `['FormattedFooBarMessage']`. **NOTE**: By default we check for the fact that `FormattedMessage` are imported from `moduleSourceName` to make sure variable alias works. This option does not do that so it's less safe.

### **`extractFromFormatMessageCall`**

Opt-in to extract from `intl.formatMessage` call with the same restrictions, e.g: has to be called with object literal such as `intl.formatMessage({ id: 'foo', defaultMessage: 'bar', description: 'baz'})`

### **`outputEmptyJson`**

output file with empty `[]` if src has no messages. For build systems like bazel that relies on specific output mapping, not writing out a file can cause issues.

### **`pragma`**

parse specific additional custom pragma. This allows you to tag certain file with metadata such as `project`. For example with this file:

```tsx
// @intl-meta project:my-custom-project
import {FormattedMessage} from 'react-intl';

<FormattedMessage defaultMessage="foo" id="bar" />;
```

and with option `{pragma: "@intl-meta"}`, we'll parse out `// @intl-meta project:my-custom-project` into `{project: 'my-custom-project'}` in the result file.

### Via Node API

The extract message descriptors are available via the `metadata` property on the object returned from Babel's `transform()` API:

```javascript
require('@babel/core').transform('code', {
  plugins: ['react-intl'],
}); // => { code, map, ast, metadata['react-intl'].messages, metadata['react-intl'].meta };
```
