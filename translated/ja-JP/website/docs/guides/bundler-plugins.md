---
id: bundler-plugins
title: Bundling with formatjs
---

Now that you've had a working pipeline. It's time to dive deeper on how to optimize the build with `formatjs`. From [Message Extraction](../getting-started/message-extraction.md) guide, we explicitly recommend against explicit ID due to potential collision in large application. While our extractor can insert IDs in the extracted JSON file, you'd need to also insert those IDs into the compiled JS output. This guide will cover how to do that.

## Using babel-plugin-react-intl

```sh
npm i -D babel-plugin-react-intl
```

Let's take this simple example:

```tsx
import {FormattedMessage} from 'react-intl';
<FormattedMessage
  description="A message"
  defaultMessage="My name is {name}"
  values={{
    name: userName,
  }}
/>;
```

During runtime this will throw an `Error` saying `ID is required`. In order to inject an ID in the transpiled JS, you can use our [babel-plugin-react-intl](../tooling/babel-plugin.md) similarly as below:

**babel.config.json**

```json
{
  "plugins": [
    [
      "react-intl",
      {
        "extractFromFormatMessageCall": true,
        "idInterpolationPattern": "[sha512:contenthash:base64:6]",
        "ast": true
      }
    ]
  ]
}
```

This will produce the following JS

```js
const {FormattedMessage} = require('react-intl');

React.createElement(FormattedMessage, {
  id: '179jda',
  defaultMessage: 'My name is {name}',
  values: {
    name: userName,
  },
});
```

:::info description Our plugin also removes `description` because it's only for translator, not end-user. :::

## Using @formatjs/ts-transformer

```sh
npm i -D @formatjs/ts-transformer
```

If you're using TypeScript, in order to enable custom AST transformer you should consider using [ttypescript](https://github.com/cevek/ttypescript), [ts-loader](https://github.com/TypeStrong/ts-loader) or similar.

Let's take this simple example:

```tsx
import {FormattedMessage} from 'react-intl';
<FormattedMessage
  description="A message"
  defaultMessage="My name is {name}"
  values={{
    name: userName,
  }}
/>;
```

### ts-loader

You can add this in your webpack config `ts-loader`.

```js
import {transform} from '@formatjs/ts-transformer';
// webpack config
module.exports = {
  rules: [
    {
      test: /\.tsx?$/,
      use: [
        {
          loader: 'ts-loader',
          options: {
            getCustomTransformers() {
              return {
                before: [
                  transform({
                    extractFromFormatMessageCall: true,
                    overrideIdFn: '[sha512:contenthash:base64:6]',
                  }),
                ],
              };
            },
          },
        },
      ],
      exclude: /node_modules/,
    },
  ],
};
```

This will produce the following JS

```js
const {FormattedMessage} = require('react-intl');

React.createElement(FormattedMessage, {
  id: '179jda',
  defaultMessage: 'My name is {name}',
  values: {
    name: userName,
  },
});
```

:::info description Our transformer also removes `description` because it's only for translator, not end-user. :::
