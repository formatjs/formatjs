---
id: installation
title: Installation
---

formatjs is a set of libraries that help you setup internationalization in any project whether it's React or not.

## Installation

```sh
npm i -S react react-intl
```

## Minimal Application

After following the step above, you should be able to get a minimal application like this running:

```tsx
import {createIntl, createIntlCache} from 'react-intl'

// Translated messages in French with matching IDs to what you declared
const messagesInFrench = {
  myMessage: "Aujourd'hui, c'est le {ts, date, ::yyyyMMdd}",
}

// This is optional but highly recommended
// since it prevents memory leak
const cache = createIntlCache()

// Create the `intl` object
const intl = createIntl(
  {
    // Locale of the application
    locale: 'fr',
    // Locale of the fallback defaultMessage
    defaultLocale: 'en',
    messages: messagesInFrench,
  },
  cache
)

// Aujourd'hui, c'est le 23/07/2020
console.log(
  intl.formatMessage(
    {
      // Matching ID as above
      id: 'myMessage',
      // Default Message in English
      defaultMessage: 'Today is {ts, date, ::yyyyMMdd}',
    },
    {ts: Date.now()}
  )
)

// 19,00 €
console.log(intl.formatNumber(19, {style: 'currency', currency: 'EUR'}))
```

## Minimal React Application

If you're using React, a minimal React application can look like this:

```tsx
import * as React from 'react'
import {IntlProvider, FormattedMessage, FormattedNumber} from 'react-intl'

// Translated messages in French with matching IDs to what you declared
const messagesInFrench = {
  myMessage: "Aujourd'hui, c'est le {ts, date, ::yyyyMMdd}",
}

export default function App() {
  return (
    <IntlProvider messages={messagesInFrench} locale="fr" defaultLocale="en">
      <p>
        <FormattedMessage
          id="myMessage"
          defaultMessage="Today is {ts, date, ::yyyyMMdd}"
          values={{ts: Date.now()}}
        />
        <br />
        <FormattedNumber value={19} style="currency" currency="EUR" />
      </p>
    </IntlProvider>
  )
}
```

Output

```html
<p>
  Aujourd'hui, c'est le 23/07/2020
  <br />
  19,00 €
</p>
```

## Adding our babel-plugin/TypeScript Transformer for compilation

Our tooling supports `babel`, `ts-loader`, `ts-jest`, `rollup-plugin-typescript2` & `ttypescript` for message compilation:

### Babel

If you're using `babel`, add `babel-plugin-react-intl` to your dependencies:

```sh
npm i -D babel-plugin-react-intl
```

and add it to your `babel.config.js` or `.babelrc`:

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

### `ts-loader`

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

### `ts-jest` in `jest.config.js`

Take a look at [`ts-jest` guide](https://github.com/kulshekhar/ts-jest/blob/master/docs/user/config/astTransformers.md) on how to incorporate custom AST Transformers.

### `ttypescript`

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

### `rollup-plugin-typescript2`

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
