# Advanced Usage

`react-intl` is optimized for both runtime & compile time rendering. Below are a few guidelines you can follow if you have a strict performance budget.

<!-- toc -->

- [Core `react-intl` & pre-parsing messages](#core-react-intl--pre-parsing-messages)
  - [Caveats](#caveats)
- [Imperative APIs](#imperative-apis)

<!-- tocstop -->

## Core `react-intl` & pre-parsing messages

We've also provided a core package that has the same API as the full `react-intl` package but without our parser. What this means is that you would have to pre-parse all messages into `AST` using [`intl-messageformat-parser`](https://www.npmjs.com/package/intl-messageformat-parser) and pass that into `IntlProvider`.

This is especially faster since it saves us time parsing `string` into `AST`. The use cases for this support are:

1. Server-side rendering or pre-parsing where you can cache the AST and don't have to pay compilation costs multiple time.
2. Desktop apps using Electron or CEF where you can preload/precompile things in advanced before runtime.

Example:

```tsx
// Pre-processed
import parser from 'intl-messageformat-parser';
const messages = {
  ast_simple: parser.parse('hello world'),
  ast_var: parser.parse('hello world, {name}'),
};

// During runtime
// ES6 import
import {IntlProvider, FormattedMessage} from 'react-intl/core';
import * as ReactDOM from 'react-dom';

ReactDOM.render(
  <IntlProvider messages={messages}>
    <FormattedMessage id="ast_simple" />
  </IntlProvider>
); // will render `hello world`
```

The package size is also roughly 30% smaller:

| Package           | Minified Size                                                                                                       | Minzipped Size                                                                                                          |
| ----------------- | ------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `react-intl`      | ![minified size](https://badgen.net/badgesize/normal/https://unpkg.com/react-intl@next/dist/react-intl.min.js)      | ![minzipped size](https://badgen.net/badgesize/gzip/https://unpkg.com/react-intl@next/dist/react-intl.min.js)           |
| `react-intl/core` | ![core min size](https://badgen.net/badgesize/normal/https://unpkg.com/react-intl@next/dist/react-intl-core.min.js) | ![core minzipped size](https://badgen.net/badgesize/gzip/https://unpkg.com/react-intl@next/dist/react-intl-core.min.js) |

### Caveats

- Since this approach uses `AST` as the data source, changes to `intl-messageformat-parser`'s `AST` will require cache invalidation
- `AST` is also larger in size than regular `string` messages but can be efficiently compressed
- Since `react-intl/core` does not have a parser, it will not be able to process string-based `defaultMessage` (will render the string as is w/o any token value replacement).

## Imperative APIs

Imperative APIs (e.g `formatMessage`...) are generally faster than `Formatted` component since it does not create extra `ReactElement` nodes. They should have the exact same capabilities as `Formatted` components.
