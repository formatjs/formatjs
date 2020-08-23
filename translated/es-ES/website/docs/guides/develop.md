---
id: develop
title: Develop with formatjs
---

Aside from a strong focus on facilitating i18n production pipeline, `formatjs` also aims to improve i18n DevEx with our [eslint-plugin-formatjs](../tooling/linter.md).

## Linter Installation

import Tabs from '@theme/Tabs' import TabItem from '@theme/TabItem'

<Tabs
groupId="npm"
defaultValue="npm"
values={[
{label: 'npm', value: 'npm'},
{label: 'yarn', value: 'yarn'},
]}>
<TabItem value="npm">

```sh
npm i -D eslint-plugin-formatjs eslint
```

</TabItem>
<TabItem value="yarn">

```sh
yarn add -D eslint-plugin-formatjs eslint
```

</TabItem>
</Tabs>

Then in your eslint config:

```json
{
  "plugins": ["formatjs"],
  "rules": {
    "formatjs/no-offset": "error"
  }
}
```

Head over to [eslint-plugin-formatjs](../tooling/linter.md) for more details on our rules.

## Error Codes

`react-intl` is designed to fail fast when there's a configuration issue but fall back to `defaultLocale` when there's a translation issues. Below are the list of errors that we emit out that can be caught during testing:

### `FORMAT_ERROR`

Issue when we try to format a sentence but some of the placeholder values are malformed, e.g passing in a `string` for a `Date` or such.

### `UNSUPPORTED_FORMATTER`

We trigger this error when a custom format is being declared but there's no corresponding formatter with it. For example:

```tsx
intl.formatMessage({
  defaultMessage: 'the price is {p, number, customCurrency}',
})
```

and there's no formatter for `customCurrency`.

### `INVALID_CONFIG`

When some config values are misconfigured such as missing `locale`.

### `MISSING_DATA`

When some native Intl APIs don't support certain locales, or missing `locale-data` when polyfills are setup. This typically happens when you're running on an older browsers/Node, or try to use newer APIs in browsers that have not supported them.

### `MISSING_TRANSLATION`

This gets triggered whenever we try to look up a translated message in `messages` for a given `id` and it's not there, thus falling back to `defaultMessage`.

:::caution verbosity This error will be triggered very often since it happens for every message that does not have a translation. Therefore if you do log it remotely there should be throttling in place. :::
