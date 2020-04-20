# Advanced Usage

`react-intl` is optimized for both runtime & compile time rendering. Below are a few guidelines you can follow if you have a strict performance budget.

<!-- toc -->

- [Pre-parsing messages](#pre-parsing-messages)
  - [Caveats](#caveats)
- [Imperative APIs](#imperative-apis)

<!-- tocstop -->

## Pre-parsing messages

You can also pre-parse all messages into `AST` using [`intl-messageformat-parser`](https://www.npmjs.com/package/intl-messageformat-parser) and pass that into `IntlProvider`. This is especially faster since it saves us time parsing `string` into `AST`. The use cases for this support are:

1. Server-side rendering or pre-parsing where you can cache the AST and don't have to pay compilation costs multiple time.
2. Desktop apps using Electron or CEF where you can preload/precompile things in advanced before runtime.

Example:

```tsx
// Pre-processed
import parser from 'intl-messageformat-parser'
const messages = {
  ast_simple: parser.parse('hello world'),
  ast_var: parser.parse('hello world, {name}'),
}

// During runtime
// ES6 import
import {IntlProvider, FormattedMessage} from 'react-intl'
import * as ReactDOM from 'react-dom'

ReactDOM.render(
  <IntlProvider messages={messages}>
    <FormattedMessage id="ast_simple" />
  </IntlProvider>
) // will render `hello world`
```

### Caveats

- Since this approach uses `AST` as the data source, changes to `intl-messageformat-parser`'s `AST` will require cache invalidation
- `AST` is also larger in size than regular `string` messages but can be efficiently compressed

## Imperative APIs

Imperative APIs (e.g `formatMessage`...) are generally faster than `Formatted` component since it does not create extra `ReactElement` nodes. They should have the exact same capabilities as `Formatted` components.
