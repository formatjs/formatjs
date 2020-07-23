---
id: installation
title: Installation
---

formatjs is a set of libraries that help you setup internationalization in any project whether it's React or not.

## Install

1. Install `react-intl`

```sh
npm i -S react-intl
```

2. Install our toolchain

```sh
npm i -D eslint eslint-plugin-formatjs @formatjs/cli
```

3. Configure your `.eslintrc.js` to incorporate our linter

```js
module.exports = {
  plugins: ['formatjs'],
  rules: {
    'formatjs/enforce-description': ['error', 'literal'],
    'formatjs/enforce-default-message': ['error', 'literal'],
    // See https://formatjs.io/docs/tooling/linter for more rules
  },
};
```

4. Add our extractor to your `scripts` in `package.json`

```json
{
  "scripts": {
    "i18n:extract": "formatjs extract 'src/**/*' --out-file lang/strings_en-US.json"
  }
}
```

## Minimal Application

After following the steps above, you should be able to get a minimal application like this running:

```tsx
import {createIntl} from 'react-intl';

const intl = createIntl({
  locale: 'en',
  messages,
});

console.log(
  intl.formatMessage(
    {
      id: 'foo',
      defaultMessage: 'Today is {ts, date, ::yyyyMMdd}',
    },
    {ts: Date.now()}
  )
);
```
