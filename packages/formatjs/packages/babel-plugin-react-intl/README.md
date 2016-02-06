# babel-plugin-react-intl

Extracts string messages for translation from modules that use [React Intl][].

_**Note:** This Babel plugin works with React Intl v2 which is [in development][v2-discussion], and **1.x of this plugin works with Babel 5, 2.x works with Babel 6**._

## Installation

```sh
$ npm install babel-plugin-react-intl
```

## Usage

**This Babel plugin only visits ES6 modules which `import` React Intl.**

The default message descriptors for the app's default language will be extracted from: `defineMessages()`, `<FormattedMessage>`, and `<FormattedHTMLMessage>`; all of which are named exports of the React Intl package.

### Via `.babelrc` (Recommended)

**.babelrc**

```json
{
  "plugins": [
    ["react-intl", {
        "messagesDir": "./build/messages/",
        "enforceDescriptions": true
    }]
  ]
}
```

#### Options

- **`messagesDir`**: The target location where the plugin will output a `.json` file corresponding to each component from which React Intl messages were extracted. If not provided, the extracted message descriptors will only be accessible via Babel's API.

- **`enforceDescriptions`**: Whether or not message declarations _must_ contain a `description` to provide context to translators. Defaults to: `false`.

- **`moduleSourceName`**: The ES6 module source name of the React Intl package. Defaults to: `"react-intl"`, but can be changed to another name/path to React Intl.

### Via CLI

```sh
$ babel --plugins react-intl script.js
```

### Via Node API

The extract message descriptors are available via the `metadata` property on the object returned from Babel's `transform()` API:

```javascript
require('babel-core').transform('code', {
  plugins: ['react-intl']
}) // => { code, map, ast, metadata['react-intl'].messages };
```


[React Intl]: http://formatjs.io/react/
[v2-discussion]: https://github.com/yahoo/react-intl/issues/162
