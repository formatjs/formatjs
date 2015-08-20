# babel-plugin-react-intl

**THIS IS A PREVIEW RELEASE THAT WORKS WITH A FUTURE, UNRELEASED VERSION OF REACT INTL.**

Extracts string messages from React components that use [React Intl][].

## Installation

```sh
$ npm install babel-plugin-react-intl
```

## Usage

### Via `.babelrc` (Recommended)

**.babelrc**

```json
{
  "plugins": ["react-intl"],
  "extra": {
    "react-intl": {
        "messagesDir": "./build/messages/"
    }
  }
}
```

The `messagesDir` option is the target location where the plugin will output a `.json` file corresponding to each component from which React Intl messages were extracted.

### Via CLI

```sh
$ babel --plugins react-intl script.js
```

### Via Node API

```javascript
require("babel-core").transform("code", {
  plugins: ["react-intl"]
}) // => { code, map, ast, metadata['react-intl'].messages };
```


[React Intl]: http://formatjs.io/react/
