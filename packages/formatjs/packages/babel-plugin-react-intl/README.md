# babel-plugin-react-intl

Extracts string messages from modules that use react-intl.

## Installation

```sh
$ npm install babel-plugin-react-intl
```

## Usage

### Via `.babelrc` (Recommended)

**.babelrc**

```json
{
  "plugins": ["react-intl"]
}
```

### Via CLI

```sh
$ babel --plugins react-intl script.js
```

### Via Node API

```javascript
require("babel-core").transform("code", {
  plugins: ["react-intl"]
});
```
